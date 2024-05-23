
import React, { FC, useContext, useEffect, useRef, useState } from 'react';
import { Avatar, List, Skeleton } from 'antd';
import InfiniteScroll from 'react-infinite-scroll-component';
import { ConversationDTO } from '../../models/Models';
import { getAllConversations } from '../../services/ChatServices';
import { AppContext } from '../../helpers/Context';

interface ConversationProps extends React.HTMLAttributes<HTMLDivElement> {
    unReadConversations?: string[] | undefined;
    onmount?: (value: number) => void;
}

const Conversation: FC<ConversationProps> = (props) => {
    const { unReadConversations, onmount } = props;
    const { addNewNotifications, user } = useContext(AppContext);
    const [loading, setLoading] = useState(false);
    const [allConversations, setAllConversations] = useState<ConversationDTO[]>([]);
    const [page, setPage] = useState(1);
    const loadingStatus = useRef(false);

    const loadMoreData = async () => {
        if (loading) {
            return;
        }
        setLoading(true);
        const result = await getAllConversations("page", page, 20);
        if (result.isSuccess && result.responseData.items && result.responseData.items.length) {
            const newData: ConversationDTO[] = [...result.responseData.items];
            setPage(prev => prev + 1);
            setLoading(false);
            if(unReadConversations && unReadConversations.length) {
                parseTheUnreadConversations(newData);
            }
            setAllConversations(prev => [...prev, ...newData]);
        } else {
            addNewNotifications(result.errorMessage, "error");
            setLoading(false);
        }
    };

    const initData = async () => {
        const result = await getAllConversations("page", 1, 20);
        if (result.isSuccess && result.responseData.items && result.responseData.items.length) {
            const newData: ConversationDTO[] = [...result.responseData.items];
            setPage(prev => prev + 1);
            setLoading(false);
            if(unReadConversations && unReadConversations.length) {
                parseTheUnreadConversations(newData);
            }
            setAllConversations(prev => [...prev, ...newData]);
        } else {
            addNewNotifications(result.errorMessage, "error");
            setLoading(false);
        }
    }

    useEffect(() => {
        if(loadingStatus.current) return;
        initData();
        if(onmount) onmount(3);
        loadingStatus.current = true;
    }, []);

    const parseTheUnreadConversations = (listConversations: ConversationDTO[]) => {
        for (let index = 0; index < listConversations.length; index++) {
            const element = listConversations[index];
            if(unReadConversations!.find(li => li === element.id)) {
                element.unRead = true;
            }
        }
    }

    console.log(unReadConversations)

    useEffect(() => {
        if(unReadConversations && unReadConversations.length) {
            parseTheUnreadConversations(allConversations);
        }
    }, [unReadConversations]);

    return (
        <div
            id="scrollableDiv"
            style={{
                height: 400,
                overflow: 'auto',
                padding: '0 16px',
                border: '1px solid rgba(140, 140, 140, 0.35)',
            }}
        >
            <InfiniteScroll
                dataLength={allConversations.length}
                next={loadMoreData}
                hasMore={allConversations.length >= 20}
                loader={<Skeleton avatar paragraph={{ rows: 1 }} active />}
                scrollableTarget="scrollableDiv"
            >
                <List
                    bordered={false}
                    dataSource={allConversations}
                    renderItem={(item) => (
                        <List.Item key={item.id} style={{ border: "none", padding: 12 }} className={`conversation-li`}>
                            <List.Item.Meta
                                avatar={<Avatar src={item.users[0].userName} />}
                                title={item.users.find(u => u.id !== user?.id)?.userName}
                                description={item.messages[0].content}
                                className={`conversation-item ${item.unRead ? "unread" : ""}`}
                            />
                            <div className='badge'></div>
                        </List.Item>
                    )}
                />
            </InfiniteScroll>
        </div>
    )
}

export default Conversation;