import ChatRoom from "@/components/ChatRoom";

export default function RoomPage({ params }: { params: { roomId: string } }) {
  const roomId = decodeURIComponent(String(params.roomId || ""));
  return <ChatRoom roomId={roomId} />;
}


