import AppLogo from "@/components/shared/AppLogo";
import Button from "@/components/shared/Button";

export function SidebarNav() {
  return (
    <>
      <AppLogo />
      <div className="mt-5">
        <p className="uppercase text-xs font-nunito-600 text-c666666b2">
          workspace
        </p>

        <div className="mt-1.5 ">
          <Button className="h-9 w-full bg-c6750a429 text-c6155f5 font-nunito-500 justify-between rounded-lg pl-2.5">
            <p className="text-sm">Convert site</p>
            <p className="text-xs font-nunito-400 text-c666666">1</p>
          </Button>
          <Button className="h-9 w-full bg-transparent text-c666666 font-nunito-400 justify-between rounded-lg pl-2.5">
            <p className="text-sm">Deployed</p>
            <p className="text-xs font-nunito-400 text-c666666">1</p>
          </Button>
          <Button className="h-9 w-full bg-transparent text-c666666 font-nunito-400 justify-between rounded-lg pl-2.5">
            <p className="text-sm">Not deployed</p>
            <p className="text-xs font-nunito-400 text-c666666">1</p>
          </Button>
        </div>
      </div>
    </>
  );
}
