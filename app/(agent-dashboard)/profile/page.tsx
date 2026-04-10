import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { redirect } from "next/navigation";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

import { getQueryClient, trpc } from "@/trpc/server";
import {
  UserProfileView,
  UserProfileViewError,
  UserProfileViewLoading,
} from "@/modules/user/ui/views/user-profile-view";

const ProfilePage = async () => {
  const { isAuthenticated } = getKindeServerSession();

  if (!(await isAuthenticated())) {
    redirect("/sign-in");
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.user.getOne.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<UserProfileViewLoading />}>
        <ErrorBoundary fallback={<UserProfileViewError />}>
          <UserProfileView />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
};

export default ProfilePage;