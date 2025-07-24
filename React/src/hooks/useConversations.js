import { useState, useEffect, useCallback } from 'react';
import { getChats, deleteChat } from '../services/chatService';
import { useNotification } from '../context/NotificationContext';

export const useConversations = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const { showNotification } = useNotification();

  const fetchConversations = useCallback(async () => {
    try {
      const response = await getChats();
      if (response?.data) {
        const parsedChats = response.data.map((chat) => ({
          id: chat.id,
          title: chat.title || `Conversa ${chat.id}`,
          hasPdf: chat.status === 'done',
          updatedAt: chat.updatedAt,
        }));
        setConversations(parsedChats);
        if (parsedChats.length > 0 && !activeConversationId) {
          setActiveConversationId(parsedChats[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      showNotification('Não foi possível carregar as conversas.', 'error');
    }
  }, [activeConversationId, showNotification]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleOpenDeleteModal = useCallback((id, title) => {
    setChatToDelete({ id, title });
    setIsDeleteModalOpen(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setChatToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!chatToDelete) return;
    try {
      await deleteChat(chatToDelete.id);
      const updatedConversations = conversations.filter(
        (c) => c.id !== chatToDelete.id
      );
      setConversations(updatedConversations);

      if (activeConversationId === chatToDelete.id) {
        setActiveConversationId(updatedConversations[0]?.id || null);
      }
      showNotification('Conversa deletada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao deletar a conversa:', error);
      showNotification('Não foi possível deletar a conversa.', 'error');
    } finally {
      handleCloseDeleteModal();
    }
  }, [
    chatToDelete,
    conversations,
    activeConversationId,
    showNotification,
    handleCloseDeleteModal,
  ]);

  const handleNewChat = useCallback(() => {
    const newChatId = `new-chat-${Date.now()}`;
    const newConversation = {
      id: newChatId,
      title: `Nova Conversa`,
      hasPdf: false,
      updatedAt: new Date().toISOString(),
    };
    setConversations((c) => [newConversation, ...c]);
    setActiveConversationId(newChatId);
  }, []);

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    isDeleteModalOpen,
    chatToDelete,
    handleOpenDeleteModal,
    handleCloseDeleteModal,
    handleConfirmDelete,
    handleNewChat,
    fetchConversations,
  };
};
