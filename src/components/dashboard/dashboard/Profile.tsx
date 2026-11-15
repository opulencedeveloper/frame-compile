"use client";

import { useCallback, useEffect, useState } from "react";
import Shimmer from "@/components/shared/Shimmer";
import { useRequestError } from "@/hooks/useRequestError";
import LogoutButton from "@/components/dashboard/dashboard/LogoutButton";
import { useHttp } from "@/hooks/useHttp";
import { USER_API } from "@/constants/user";
import { profileContent } from "@/resources/dashboard";
import { UserProfile } from "@/types/dashboard";

export function Profile() {
  const { error, sendHttpRequest } = useHttp();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const loadProfile = useCallback(() => {
    sendHttpRequest({
      requestConfig: { url: USER_API.ME, method: "GET" },
      successRes: (res) => setProfile(res.data.data as UserProfile),
    });
  }, [sendHttpRequest]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useRequestError(error, loadProfile);

  return (
    <div className="hidden min-[1088px]:block w-56 shrink-0 h-full overflow-y-auto pt-8">
      {profile ? (
        <div className="flex items-center space-x-2 w-full">
          <div className="bg-c8a8a8a h-6.5 w-6.5 shrink-0 flex items-center justify-center rounded-full">
            <p className="text-sm font-nunito-500 text-white text-center">
              {profile.name.charAt(0).toUpperCase()}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-c292929 font-nunito-500 text-base truncate">{profile.name}</p>
            <p className="text-c767676 font-nunito-400 text-base truncate" title={profile.email}>
              {profile.email}
            </p>
          </div>
        </div>
      ) : (
        <div role="status" aria-label={profileContent.loading} className="flex items-center space-x-2 w-full">
          <Shimmer className="h-6.5 w-6.5 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-4 w-36" />
          </div>
        </div>
      )}

      <LogoutButton className="mb-8.75" />
    </div>
  );
}
