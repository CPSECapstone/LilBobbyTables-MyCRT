
export interface LoginBody {
   email: string;
   password: string;
}

export interface SignupBody extends LoginBody {
   agreeToTerms: boolean;
}

export interface ChangePasswordBody {
   oldPassword: string;
   password: string;
}

export interface ForgotPasswordBody {
   email: string;
}
