import InviteAccept from "@/components/InviteAccept";

export const metadata = {
  title: "Compartir tenencia",
};

export default function InvitePage({ params }: { params: { token: string } }) {
  return <InviteAccept token={params.token} />;
}
