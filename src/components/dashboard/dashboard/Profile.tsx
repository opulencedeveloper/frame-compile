import PowerIcon from "@/assets/icons/power.svg";
import Button from "@/components/shared/Button";
import SmartImage from "@/components/shared/SmartImage";

export function Profile() {
  return (
    <div className="hidden min-[1088px]:block w-56 shrink-0 h-full overflow-y-auto pt-8">
     <div className="flex items-center space-x-2 w-full">
      <div className="bg-c8a8a8a h-6.5 w-6.5 flex items-center justify-center rounded-full">
        <p className="text-sm font-nunito-500 text-white text-center">O</p>
      </div>

      <div>
        <p className="text-c292929 font-nunito-500 text-base">ologwusamuel</p>
        <p className="text-c767676 font-nunito-400 text-base">ologwusam@gmail.com</p>
      </div>
     </div>

      <Button
          className="bg-transparent text-c292929 w-max mb-8.75"
          rightIcon={<SmartImage src={PowerIcon} alt="log out" width={16} height={16} />}
        >
         Logout
        </Button>
    </div>
  );
}
