import { createFileRoute } from "@tanstack/react-router";
import { useAccess } from "@/hooks/use-auth";
import { NoAccess, PageTitle } from "@/components/dashboard/ui";
import { PostsManager } from "@/components/dashboard/PostsManager";

export const Route = createFileRoute("/_authenticated/dashboard/notices")({
  component: () => {
    const { can } = useAccess();
    return (
      <div>
        <PageTitle title="Site notices" subtitle="Short alerts shown at the top of the home page (latest 3)" />
        {can("CAN_POST_NOTICES") ? <PostsManager table="notices" noun="Notice" /> : <NoAccess />}
      </div>
    );
  },
});
