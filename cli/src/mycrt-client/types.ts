
export interface LoginBody {
   email: string;
   password: string;
}

export interface SignupBody extends LoginBody {
   agreeToTerms: boolean;
}

export interface ResetPasswordBody {
   newPassword: string;
   newPasswordAgain: string;
}

export interface ChangePasswordBody extends ResetPasswordBody {
   oldPassword: string;
}

export interface ForgotPasswordBody {
   email: string;
}
