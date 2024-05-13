
import React, { FC, useContext, useEffect, useState } from 'react';
import { Avatar, List, Skeleton } from 'antd';
import InfiniteScroll from 'react-infinite-scroll-component';
import { ConversationDTO } from '../../models/Models';
import { getAllConversations } from '../../services/ChatServices';
import { AppContext } from '../../helpers/Context';


interface ConversationProps extends React.HTMLAttributes<HTMLDivElement> {
}

const Conversation: FC<ConversationProps> = (props) => {
    const { addNewNotifications } = useContext(AppContext);
    const [loading, setLoading] = useState(false);
    const [allConversations, setAllConversations] = useState<ConversationDTO[]>([]);

    const loadMoreData = async () => {
        if (loading) {
            return;
        }
        setLoading(true);
        const result = await getAllConversations();
        if (result.isSuccess && result.responseData.items && result.responseData.items.length) {
            setAllConversations(result.responseData.items);
            setLoading(false);
        } else {
            addNewNotifications(result.errorMessage, "error");
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMoreData();
    }, []);

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
                        <List.Item key={item.id} style={{border: "none"}}>
                            <List.Item.Meta
                                avatar={<Avatar src={item.users[0].userName} />}
                                title={item.users.find(u => u.id === item.fromUserId)?.userName}
                                description={item.messages[0].content}
                            />
                        </List.Item>
                    )}
                />
            </InfiniteScroll>
        </div>
    )
}

export default Conversation;