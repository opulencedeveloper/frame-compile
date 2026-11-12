import { utils } from "../utils";
import { MessageResponse } from "../utils/enum";
import { userService } from "./service";
import { IUserProfileDto, UserDocument } from "./interface";

class UserController {
  public async getProfile(userId: string) {
    const user = await userService.getUserById(userId);

    return utils.customResponse({
      status: 200,
      message: MessageResponse.Success,
      description: "Profile found.",
      data: this.toProfileDto(user),
    });
  }

  private toProfileDto(user: UserDocument): IUserProfileDto {
    return {
      name: user.name || user.email.split("@")[0],
      email: user.email,
    };
  }
}

export const userController = new UserController();
