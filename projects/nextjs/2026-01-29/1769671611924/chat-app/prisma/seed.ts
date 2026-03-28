import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({
  url: 'file:./dev.db'
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // Create demo users
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice Johnson',
      passwordHash: '$2a$10$placeholder_hash_for_development', // In real app, use bcrypt
      avatarUrl: null,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob Smith',
      passwordHash: '$2a$10$placeholder_hash_for_development',
      avatarUrl: null,
    },
  });

  console.log('✅ Created demo users:', { user1: user1.email, user2: user2.email });

  // Create demo conversations
  const conversation1 = await prisma.conversation.create({
    data: {
      title: 'Getting Started with Claude',
      participants: {
        create: [
          {
            userId: user1.id,
            role: 'owner',
          },
        ],
      },
      messages: {
        create: [
          {
            senderId: user1.id,
            content: 'Hello! Can you help me understand how AI assistants work?',
            role: 'user',
          },
          {
            senderId: null, // AI assistant has no sender
            content:
              "Hello! I'd be happy to help you understand how AI assistants work. AI assistants like me are large language models trained on vast amounts of text data. We can understand and generate human-like text, answer questions, help with tasks, and engage in conversations. What specific aspect would you like to know more about?",
            role: 'assistant',
            metadata: JSON.stringify({
              model: 'claude-sonnet-4-5-20250929',
              tokensUsed: 78,
              finishReason: 'end_turn',
            }),
          },
          {
            senderId: user1.id,
            content: 'That\'s fascinating! How do you process my questions?',
            role: 'user',
          },
          {
            senderId: null,
            content:
              'When you ask me a question, here\'s what happens:\n\n1. **Text Processing**: Your message is broken down into smaller units called tokens\n2. **Context Understanding**: I analyze your question along with our conversation history\n3. **Response Generation**: I use patterns learned during training to generate relevant responses\n4. **Quality Control**: The response is checked for safety and relevance\n\nThe entire process happens in milliseconds, allowing for real-time conversation!',
            role: 'assistant',
            metadata: JSON.stringify({
              model: 'claude-sonnet-4-5-20250929',
              tokensUsed: 124,
              finishReason: 'end_turn',
            }),
            isRead: true,
          },
        ],
      },
    },
  });

  const conversation2 = await prisma.conversation.create({
    data: {
      title: 'Project Planning Discussion',
      participants: {
        create: [
          {
            userId: user2.id,
            role: 'owner',
          },
        ],
      },
      messages: {
        create: [
          {
            senderId: user2.id,
            content: 'I need help planning a web development project. Where should I start?',
            role: 'user',
          },
          {
            senderId: null,
            content:
              'Great question! Here\'s a structured approach to planning a web development project:\n\n**1. Define Requirements**\n- What problem are you solving?\n- Who are your users?\n- What features are essential vs. nice-to-have?\n\n**2. Choose Your Tech Stack**\n- Frontend framework (React, Vue, etc.)\n- Backend technology (Node.js, Python, etc.)\n- Database (PostgreSQL, MongoDB, etc.)\n\n**3. Design Architecture**\n- Sketch user flows\n- Plan database schema\n- Define API endpoints\n\n**4. Set Up Development Environment**\n- Version control (Git)\n- Project structure\n- Development tools\n\nWould you like to dive deeper into any of these areas?',
            role: 'assistant',
            metadata: JSON.stringify({
              model: 'claude-sonnet-4-5-20250929',
              tokensUsed: 198,
              finishReason: 'end_turn',
            }),
          },
        ],
      },
    },
  });

  const conversation3 = await prisma.conversation.create({
    data: {
      title: null, // Untitled conversation
      participants: {
        create: [
          {
            userId: user1.id,
            role: 'owner',
          },
        ],
      },
      messages: {
        create: [
          {
            senderId: user1.id,
            content: 'What\'s the weather like today?',
            role: 'user',
          },
        ],
      },
    },
  });

  console.log('✅ Created demo conversations:', {
    conversation1: conversation1.title,
    conversation2: conversation2.title,
    conversation3: conversation3.title || '(untitled)',
  });

  // Create a multi-user conversation
  const groupConversation = await prisma.conversation.create({
    data: {
      title: 'Team Collaboration',
      participants: {
        create: [
          {
            userId: user1.id,
            role: 'owner',
          },
          {
            userId: user2.id,
            role: 'member',
          },
        ],
      },
      messages: {
        create: [
          {
            senderId: user1.id,
            content: 'Hey team, let\'s discuss our approach for the new feature.',
            role: 'user',
          },
          {
            senderId: user2.id,
            content: 'Sounds good! I think we should start with the database schema.',
            role: 'user',
          },
        ],
      },
    },
  });

  console.log('✅ Created group conversation:', groupConversation.title);

  console.log('\n🎉 Database seeding complete!');
  console.log('\nSummary:');
  console.log(`- Users: ${await prisma.user.count()}`);
  console.log(`- Conversations: ${await prisma.conversation.count()}`);
  console.log(`- Messages: ${await prisma.message.count()}`);
  console.log(`- Participants: ${await prisma.conversationParticipant.count()}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
