const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'chat.db');
const db = new Database(dbPath);

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

function generateAvatarColor() {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

console.log('Seeding database...');

// Create users
const passwordHash = bcrypt.hashSync('password123', 10);

const users = [
  {
    id: generateId(),
    username: 'alice',
    email: 'alice@example.com',
    password_hash: passwordHash,
    avatar_color: generateAvatarColor(),
    created_at: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
  },
  {
    id: generateId(),
    username: 'bob',
    email: 'bob@example.com',
    password_hash: passwordHash,
    avatar_color: generateAvatarColor(),
    created_at: Date.now() - 20 * 24 * 60 * 60 * 1000, // 20 days ago
  },
  {
    id: generateId(),
    username: 'charlie',
    email: 'charlie@example.com',
    password_hash: passwordHash,
    avatar_color: generateAvatarColor(),
    created_at: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
  },
  {
    id: generateId(),
    username: 'ChatBot',
    email: 'bot@chat.app',
    password_hash: passwordHash,
    avatar_color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    created_at: Date.now() - 365 * 24 * 60 * 60 * 1000, // 1 year ago
  },
];

const insertUser = db.prepare(
  'INSERT INTO users (id, username, email, password_hash, avatar_color, created_at) VALUES (?, ?, ?, ?, ?, ?)'
);

users.forEach((user) => {
  insertUser.run(
    user.id,
    user.username,
    user.email,
    user.password_hash,
    user.avatar_color,
    user.created_at
  );
});

console.log(`Created ${users.length} users`);

// Helper to get random user (excluding bot)
function getRandomUser(exclude = []) {
  const availableUsers = users.filter(
    (u) => u.email !== 'bot@chat.app' && !exclude.includes(u.id)
  );
  return availableUsers[Math.floor(Math.random() * availableUsers.length)];
}

function getBotUser() {
  return users.find((u) => u.email === 'bot@chat.app');
}

// Sample conversation topics and messages
const conversationTemplates = [
  {
    title: 'Weekend Plans 🎉',
    messages: [
      { user: 'alice', content: "Hey everyone! What are your plans for the weekend?" },
      { user: 'bob', content: "I'm thinking about going hiking if the weather is nice." },
      { user: 'bot', content: "That sounds like a great plan! What trail are you considering?" },
      { user: 'bob', content: "Probably the Blue Ridge trail. It has amazing views." },
      { user: 'charlie', content: "Oh I've been there! It's beautiful this time of year." },
      { user: 'alice', content: "Maybe I'll join you! I love hiking." },
      { user: 'bot', content: "A group hike sounds like fun! What time were you thinking?" },
      { user: 'bob', content: "How about Saturday morning? 8 AM?" },
      { user: 'charlie', content: "Perfect! I'll bring snacks." },
      { user: 'alice', content: "I'll bring water bottles for everyone!" },
      { user: 'bot', content: "Great teamwork! Have a wonderful time hiking together." },
    ],
  },
  {
    title: 'Project Discussion 💼',
    messages: [
      { user: 'charlie', content: "Can we discuss the new project timeline?" },
      { user: 'bot', content: "Of course! What aspects of the timeline are you concerned about?" },
      { user: 'charlie', content: "I think we need more time for the testing phase." },
      { user: 'alice', content: "I agree. We discovered some edge cases that need attention." },
      { user: 'bob', content: "How much additional time do you think we need?" },
      { user: 'charlie', content: "At least two more weeks would be ideal." },
      { user: 'alice', content: "That would give us time to properly test everything." },
      { user: 'bot', content: "That sounds reasonable. Have you considered the dependencies?" },
      { user: 'bob', content: "Good point. The frontend depends on the API being stable." },
      { user: 'charlie', content: "Right, so we should extend both phases." },
      { user: 'alice', content: "Let's propose this to the team lead tomorrow." },
      { user: 'bot', content: "Excellent plan! Clear communication is key to project success." },
      { user: 'bob', content: "I'll draft a proposal tonight." },
      { user: 'charlie', content: "Thanks Bob! Send it our way for review." },
      { user: 'alice', content: "Perfect! Looking forward to seeing it." },
    ],
  },
  {
    title: 'Book Club 📚',
    messages: [
      { user: 'alice', content: "What did everyone think of this month's book?" },
      { user: 'bob', content: "I loved it! The plot twist in chapter 12 was incredible." },
      { user: 'bot', content: "That's great to hear! What made the twist so impactful for you?" },
      { user: 'bob', content: "I never saw it coming. The author did an amazing job with foreshadowing." },
      { user: 'charlie', content: "I had mixed feelings about the ending though." },
      { user: 'alice', content: "Really? I thought it was beautifully bittersweet." },
      { user: 'bot', content: "Different interpretations make for interesting discussions!" },
      { user: 'charlie', content: "True! I guess I wanted more closure for the main character." },
      { user: 'bob', content: "That's fair. It was definitely left open-ended." },
      { user: 'alice', content: "Maybe that's what makes it memorable? We're still thinking about it." },
      { user: 'charlie', content: "Good point! What should we read next month?" },
      { user: 'bot', content: "Great question! Any genre preferences from the group?" },
      { user: 'bob', content: "How about a mystery novel?" },
      { user: 'alice', content: "Ooh yes! I have some recommendations." },
      { user: 'charlie', content: "Perfect! Share them and we'll vote." },
      { user: 'alice', content: "I'll send a list by tomorrow!" },
      { user: 'bot', content: "Looking forward to the next book selection!" },
    ],
  },
  {
    title: 'Lunch Recommendations 🍔',
    messages: [
      { user: 'bob', content: "Anyone know a good place for lunch nearby?" },
      { user: 'bot', content: "What kind of food are you in the mood for?" },
      { user: 'bob', content: "Maybe Italian or Mexican?" },
      { user: 'charlie', content: "There's a great Italian place on Main Street!" },
      { user: 'alice', content: "Oh, Luigi's? Their pasta is amazing!" },
      { user: 'bob', content: "That sounds perfect. Is it expensive?" },
      { user: 'charlie', content: "Pretty reasonable. Around $15-20 per person." },
      { user: 'bot', content: "Sounds like a good value for quality Italian food!" },
      { user: 'alice', content: "Their lunch specials are even better deals." },
      { user: 'bob', content: "Awesome! Want to go together?" },
      { user: 'charlie', content: "Sure! What time?" },
      { user: 'alice', content: "How about 12:30?" },
      { user: 'bob', content: "Perfect! See you then." },
      { user: 'bot', content: "Enjoy your lunch! Italian food is always a great choice." },
    ],
  },
];

// Create conversations with messages
const insertConversation = db.prepare(
  'INSERT INTO conversations (id, title, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
);

const insertMember = db.prepare(
  'INSERT INTO conversation_members (conversation_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)'
);

const insertMessage = db.prepare(
  'INSERT INTO messages (id, conversation_id, sender_id, content, type, created_at) VALUES (?, ?, ?, ?, ?, ?)'
);

conversationTemplates.forEach((template, index) => {
  const conversationId = generateId();
  const creator = users[index % (users.length - 1)]; // Exclude bot from being creator
  const baseTime = Date.now() - (conversationTemplates.length - index) * 24 * 60 * 60 * 1000;

  // Create conversation
  insertConversation.run(
    conversationId,
    template.title,
    creator.id,
    baseTime,
    baseTime + template.messages.length * 10 * 60 * 1000 // Updated time based on last message
  );

  // Add all non-bot users as members
  const conversationUsers = users.filter((u) => u.email !== 'bot@chat.app');
  conversationUsers.forEach((user) => {
    const role = user.id === creator.id ? 'admin' : 'member';
    insertMember.run(conversationId, user.id, role, baseTime);
  });

  // Add bot as member
  const bot = getBotUser();
  insertMember.run(conversationId, bot.id, 'member', baseTime);

  // Create messages
  template.messages.forEach((msg, msgIndex) => {
    let sender;
    if (msg.user === 'bot') {
      sender = getBotUser();
    } else {
      sender = users.find((u) => u.username.toLowerCase() === msg.user);
    }

    if (!sender) {
      console.error(`Could not find user for: ${msg.user}`);
      return;
    }

    const messageTime = baseTime + msgIndex * 10 * 60 * 1000; // 10 minutes apart

    insertMessage.run(
      generateId(),
      conversationId,
      sender.id,
      msg.content,
      'text',
      messageTime
    );
  });

  console.log(`Created conversation: ${template.title} with ${template.messages.length} messages`);
});

console.log('Database seeded successfully!');
console.log('\nTest accounts:');
console.log('- Email: alice@example.com, Password: password123');
console.log('- Email: bob@example.com, Password: password123');
console.log('- Email: charlie@example.com, Password: password123');

db.close();
