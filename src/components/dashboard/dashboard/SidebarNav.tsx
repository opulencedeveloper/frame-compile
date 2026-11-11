"use client";

import { useDispatch, useSelector } from "react-redux";
import AppLogo from "@/components/shared/AppLogo";
import Button from "@/components/shared/Button";
import { cn } from "@/lib/utils";
import { sidebarFilterItems } from "@/resources/dashboard";
import { AppDispatch, RootState } from "@/store/redux";
import { conversionsActions } from "@/store/redux/conversions-slice";

export function SidebarNav() {
  const dispatch = useDispatch<AppDispatch>();
  const { counts, filter } = useSelector((state: RootState) => state.conversions);

  return (
    <>
      <AppLogo />
      <div className="mt-5">
        <p className="uppercase text-xs font-nunito-600 text-c666666b2">
          workspace
        </p>

        <div className="mt-1.5 ">
          {sidebarFilterItems.map((item) => {
            const isActive = filter === item.value;
            return (
              <Button
                key={item.value}
                onClick={() => dispatch(conversionsActions.setFilter(item.value))}
                aria-pressed={isActive}
                className={cn(
                  "h-9 w-full justify-between rounded-lg pl-2.5",
                  isActive
                    ? "bg-c6750a429 text-c6155f5 font-nunito-500"
                    : "bg-transparent text-c666666 font-nunito-400",
                )}
              >
                <span className="text-sm">{item.label}</span>
                <span className="text-xs font-nunito-400 text-c666666">
                  {counts ? counts[item.count] : ""}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </>
  );
}
