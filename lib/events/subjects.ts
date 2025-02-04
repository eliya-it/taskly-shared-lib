export interface SubjectsTypes {
  TODO_URGENT: "todo:urgent";
  USER_CREATED: "user:created";
  USER_DELETED: "user:deleted";
}

export const Subjects: SubjectsTypes = {
  TODO_URGENT: "todo:urgent",
  USER_CREATED: "user:created",
  USER_DELETED: "user:deleted",
} as const;
