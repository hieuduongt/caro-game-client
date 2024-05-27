import React, { FC, useEffect, useRef, useState } from "react";
import { Button, Avatar, Collapse, Input, notification } from 'antd';
import { SendOutlined, CloseCircleOutlined, CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import ScrollToBottom, { FunctionContext, StateContext, useAtStart } from 'react-scroll-to-bottom';
import { ConversationDTO, MessageDto, NotificationDto, NotificationTypes, PaginationObject, UserDTO } from "../../models/Models";
import "./MessageCard.css";
import { getConversation, getMessage, sendMessageToUser } from "../../services/ChatServices";
import { formatUTCDateToLocalDate } from "../../helpers/Helper";
import { createNotification } from "../../services/NotificationServices";
import { v4 as uuidv4 } from 'uuid';
const { Search } = Input;

interface MessageCardProps extends React.HTMLAttributes<HTMLDivElement> {
    conversationId: string;
    handleCloseMessageCard: (conversationId: string) => void;
    addNewNotifications: (data: NotificationDto | NotificationDto[] | string | string[], type: "success" | "info" | "warning" | "error") => void;
    user: UserDTO;
    connection: any;
}

const MessageCard: FC<MessageCardProps> = (props) => {
    const [api, contextHolder] = notification.useNotification();
    const { conversationId, handleCloseMessageCard, user, addNewNotifications, connection } = props;
    const [messages, setMessages] = useState<MessageDto[]>([]);
    const [pagination, setPagination] = useState<PaginationObject>();
    const [conversation, setConversation] = useState<ConversationDTO>();
    const [open, setOpen] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    const [messageInputValue, setMessageInputValue] = useState<string>("");
    const [unRead, setUnRead] = useState<boolean>(false);
    const isLoaded = useRef<boolean>(false);
    const [messagesLoading, setMessagesLoading] = useState<boolean>(false);

    const getTheConversation = async (conversationId: string) => {
        const res = await getConversation(conversationId);
        if (res.isSuccess) {
            setConversation(res.responseData);
        } else {
            addNewNotifications(res.errorMessage, "error");
        }
    }

    const renderOutgoingIncomingMessage = (isMyMessage: boolean) => {
        return isMyMessage ? "outgoing-message" : "incomming-message";
    }

    const getMessagesOfConversation = async (conversationId: string, page?: number, pageSize?: number) => {
        const res = await getMessage(conversationId, page || 0, pageSize || 20);
        if (res.isSuccess) {
            setPagination({ currentPage: res.responseData.currentPage, pageSize: res.responseData.pageSize, totalPages: res.responseData.totalPages, totalRecords: res.responseData.totalRecords });
            addMessage(res.responseData.items || []);
        } else {
            addNewNotifications(res.errorMessage, "error");
        }
    }

    const addMessage = (data: string | MessageDto | MessageDto[]) => {
        if (Array.isArray(data)) {
            setMessages(prev => [...prev, ...data]);
            return;
        }

        if (typeof data === "string") {
            const newMessageDto: MessageDto = {
                conversationId: conversationId,
                content: data,
                userId: user?.id,
                toUserId: conversation?.users.find(u => u.id !== user?.id)?.id,
            }
            setMessages(prev => [...prev, newMessageDto]);
            return;
        }

        if (typeof data === "object") {
            setMessages(prev => [...prev, data]);
            return;
        }
    }

    useEffect(() => {
        if (isLoaded.current) return;
        if (connection) {
            connection.on("NewPersonalMessage", (data: MessageDto) => {
                if (data.conversationId === conversationId) {
                    addMessage(data);
                    setUnRead(true);
                }
            });
            isLoaded.current = true;
        }
        if (conversationId && connection) {
            getTheConversation(conversationId);
            getMessagesOfConversation(conversationId, 0, 20);
        }
    }, [conversationId, connection]);

    const sendNotificationWhenSendingMessage = async (): Promise<boolean> => {
        const newNoti: NotificationDto = {
            userId: user.id,
            conversationId: conversationId,
            description: "Your have a new message",
            notificationType: NotificationTypes.UnreadMessage,
            seen: false,
            link: ""
        }

        const res = await createNotification(newNoti);

        if (res.isSuccess) {
            return true;
        } else {
            const newNotification: NotificationDto = {
                id: uuidv4(),
                userId: user.id,
                conversationId: conversationId,
                description: res.errorMessage.toString(),
                notificationType: NotificationTypes.StandardNotification,
                seen: false,
                link: ""
            }
            addNewNotifications(newNotification, "error");
        }
        return false;
    }

    const handleSendMessage = async (value: string, event?: any) => {
        if (!value) return;
        setLoading(true);
        const newMessageDto: MessageDto = {
            conversationId: conversationId,
            content: value,
            userId: user?.id,
            toUserId: conversation?.users.find(u => u.id !== user?.id)?.id,
        }

        const res = await sendMessageToUser(newMessageDto);
        if (res.isSuccess) {
            const sendStatus = await sendNotificationWhenSendingMessage();
            if (sendStatus) {
                const newMessage: MessageDto = {
                    content: value,
                    userId: user?.id || "",
                    isNewMessage: true,
                    createdDate: new Date(),
                    updatedDate: new Date()
                };
                addMessage(newMessage);
                setLoading(false);
            }
        } else {
            api.error({
                message: 'Send Failed',
                description: "Cannot send your message with error:" + res.errorMessage,
                duration: -1,
                placement: "top"
            })
        }
        event.target.blur();
        setMessageInputValue("");
    }

    const loadMoreMessages = async () => {
        setMessagesLoading(true);
        const currentPage = pagination?.currentPage;
        if (currentPage === 1 || pagination?.totalRecords === messages.length) return;
        const res = await getMessage(conversationId, currentPage! - 1, 20);
        if (res.isSuccess) {
            setPagination({ currentPage: res.responseData.currentPage, pageSize: res.responseData.pageSize, totalPages: res.responseData.totalPages, totalRecords: res.responseData.totalRecords });
            setMessages(prev => [...res.responseData.items || [], ...prev]);
        } else {
            addNewNotifications(res.errorMessage, "error");
        }
        setMessagesLoading(false);
    }

    return (
        <div className="message-card" onClick={() => setUnRead(false)}>
            {contextHolder}
            <div className={`title ${unRead ? 'have-message' : ""}`}>
                <div className='from-user'>
                    <Button
                        type="text"
                        shape="circle"
                        size='small'
                        icon={open ? <CaretDownOutlined /> : <CaretUpOutlined />}
                        onClick={() => setOpen(prev => !prev)}
                    />
                    From: {conversation?.users.find(u => u.id !== user?.id)?.userName}
                </div>
                <div className="close-message-action">
                    <Button type="link" danger shape="circle" size='small' icon={<CloseCircleOutlined />}
                        onClick={() => handleCloseMessageCard(conversationId)}
                    />
                </div>
            </div>
            <ScrollToBottom className={open ? "card-body" : "card-body close"} scrollViewClassName='messages'>
                {pagination?.currentPage !== 1 ?
                    <Button type="link" size="small" loading={messagesLoading} onClick={() => loadMoreMessages()}>
                        Previous Messages
                    </Button> : <></>}
                {
                    messages.map(ms => (
                        <Collapse
                            className={`${renderOutgoingIncomingMessage(ms.userId === user?.id)}`}
                            items={[{
                                key: ms.id,
                                label: <span>{ms.content}</span>,
                                children: <span>Sent at {formatUTCDateToLocalDate(ms.updatedDate!)}</span>
                            }]}
                            expandIcon={() =>
                                <Avatar style={{ verticalAlign: 'middle', cursor: "pointer" }} size={20} gap={2}>
                                    {conversation?.users.find(u => u.id === ms.userId)?.userName}
                                </Avatar>
                            }
                            size="small"
                            expandIconPosition={ms.userId === user?.id ? "start" : "end"}
                        />
                    ))
                }

            </ScrollToBottom>
            <div className="send-action">
                <Search
                    placeholder="Type your messages here"
                    enterButton={<SendOutlined />}
                    size="middle"
                    value={messageInputValue}
                    loading={loading}
                    onSearch={(value: string, event) => handleSendMessage(value, event)}
                    onChange={(event) => setMessageInputValue(event.target.value)}
                />
            </div>
        </div>
    )
}

export default MessageCard;