import Joi from "joi";
import { BaseValidator } from "../utils/validator";
import { GoogleOAuthState } from "../utils/interface";

class UserValidator extends BaseValidator {

}

export const userValidator = new UserValidator();
