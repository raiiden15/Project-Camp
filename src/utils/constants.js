export const UserRolesEnum = {
    ADMIN: "admin",
    PROJECT_ADMIN: "project_admin",
    MEMBER: "member",
};

export const Available_User_Role = Object.values(UserRolesEnum); // returns an value array, values of our object.

export const TaskStatusEnum = {
    TODO: "todo",
    IN_PROGRESS: "in_progress",
    DONE: "done",
};

export const Available_Task_Statuses = Object.values(TaskStatusEnum);
