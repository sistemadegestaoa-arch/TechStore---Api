-- Script SQL para verificar e corrigir problemas no chat

-- 1. Verificar conversas com usuários inválidos
SELECT 
    c.id as conversation_id,
    c."user1Id",
    u1.name as user1_name,
    c."user2Id",
    u2.name as user2_name,
    c."lastMessage",
    c."lastMessageAt"
FROM conversations c
LEFT JOIN users u1 ON c."user1Id" = u1.id
LEFT JOIN users u2 ON c."user2Id" = u2.id
WHERE u1.id IS NULL OR u2.id IS NULL;

-- 2. Contar conversas inválidas
SELECT COUNT(*) as invalid_conversations
FROM conversations c
LEFT JOIN users u1 ON c."user1Id" = u1.id
LEFT JOIN users u2 ON c."user2Id" = u2.id
WHERE u1.id IS NULL OR u2.id IS NULL;

-- 3. Verificar mensagens órfãs
SELECT 
    m.id as message_id,
    m."conversationId",
    m."senderId",
    m."receiverId",
    m.message,
    m."createdAt"
FROM messages m
LEFT JOIN conversations c ON m."conversationId" = c.id
WHERE c.id IS NULL;

-- 4. Listar todos os usuários disponíveis
SELECT 
    id,
    name,
    email,
    role,
    "isActive"
FROM users
ORDER BY "createdAt" DESC;

-- 5. DELETAR conversas inválidas (CUIDADO!)
-- Descomente as linhas abaixo para executar a limpeza

-- DELETE FROM messages 
-- WHERE "conversationId" IN (
--     SELECT c.id
--     FROM conversations c
--     LEFT JOIN users u1 ON c."user1Id" = u1.id
--     LEFT JOIN users u2 ON c."user2Id" = u2.id
--     WHERE u1.id IS NULL OR u2.id IS NULL
-- );

-- DELETE FROM conversations
-- WHERE id IN (
--     SELECT c.id
--     FROM conversations c
--     LEFT JOIN users u1 ON c."user1Id" = u1.id
--     LEFT JOIN users u2 ON c."user2Id" = u2.id
--     WHERE u1.id IS NULL OR u2.id IS NULL
-- );

-- 6. DELETAR mensagens órfãs (CUIDADO!)
-- Descomente a linha abaixo para executar a limpeza

-- DELETE FROM messages
-- WHERE "conversationId" NOT IN (SELECT id FROM conversations);
