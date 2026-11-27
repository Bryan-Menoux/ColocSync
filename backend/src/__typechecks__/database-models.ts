import type {
  Account,
  ActivityLog,
  Conversation,
  ConversationParticipant,
  Document,
  Event,
  EventParticipant,
  Expense,
  ExpenseShare,
  Folder,
  House,
  HouseInvitation,
  Membership,
  Message,
  Notification,
  Repayment,
  Session,
  ShoppingCategory,
  ShoppingItem,
  Tag,
  Task,
  TaskAssignment,
  TaskRecurrence,
  User,
  UserTag,
  Verification,
} from "../generated/prisma/client";
import type { Prisma, PrismaClient } from "../generated/prisma/client";

type GeneratedRows = {
  Account: Account;
  ActivityLog: ActivityLog;
  Conversation: Conversation;
  ConversationParticipant: ConversationParticipant;
  Document: Document;
  Event: Event;
  EventParticipant: EventParticipant;
  Expense: Expense;
  ExpenseShare: ExpenseShare;
  Folder: Folder;
  House: House;
  HouseInvitation: HouseInvitation;
  Membership: Membership;
  Message: Message;
  Notification: Notification;
  Repayment: Repayment;
  Session: Session;
  ShoppingCategory: ShoppingCategory;
  ShoppingItem: ShoppingItem;
  Tag: Tag;
  Task: Task;
  TaskAssignment: TaskAssignment;
  TaskRecurrence: TaskRecurrence;
  User: User;
  UserTag: UserTag;
  Verification: Verification;
};

type GeneratedDelegates = Pick<
  PrismaClient,
  | "account"
  | "activityLog"
  | "conversation"
  | "conversationParticipant"
  | "document"
  | "event"
  | "eventParticipant"
  | "expense"
  | "expenseShare"
  | "folder"
  | "house"
  | "houseInvitation"
  | "membership"
  | "message"
  | "notification"
  | "repayment"
  | "session"
  | "shoppingCategory"
  | "shoppingItem"
  | "tag"
  | "task"
  | "taskAssignment"
  | "taskRecurrence"
  | "user"
  | "userTag"
  | "verification"
>;

export type GeneratedDatabaseTypes = GeneratedRows & GeneratedDelegates;

const expenseCreate: Prisma.ExpenseCreateInput = {
  title: "test",
  amount: 1,
  expenseDate: new Date(),
  isPrivate: true,
  house: { connect: { id: 1 } },
  payer: { connect: { id: "test-user" } },
};
const expenseFilter: Prisma.ExpenseWhereInput = {
  amount: { gt: 0 },
  isPrivate: false,
};
const expenseRead: Prisma.ExpenseWhereUniqueInput = { id: 1 };
const expenseUpdate: Prisma.ExpenseUpdateInput = { title: { set: "updated" } };
const expenseSelect = { id: true, title: true, amount: true } satisfies Prisma.ExpenseSelect;

void [expenseCreate, expenseFilter, expenseRead, expenseUpdate, expenseSelect];
