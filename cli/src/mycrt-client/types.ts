
export interface LoginBody {
   email: string;
   password: string;
}

export interface SignupBody extends LoginBody {
   agreeToTerms: boolean;
}
