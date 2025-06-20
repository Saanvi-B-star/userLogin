export interface CreateUserDTO {
    email: string;
    password: string;
    firstname: string;
    lastname: string;
}

export interface UpdateUserDTO {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
}