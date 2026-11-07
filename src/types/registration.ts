export interface RegistrationDetails {
  fullName: string
  workplace: string
  consent: boolean
}

export interface RegistrationFormData extends RegistrationDetails {
  email: string
  password: string
}
