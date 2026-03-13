import { MessageSquareText } from "lucide-react";

export default function EmptyChat() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="max-w-md text-center px-6">
        <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
          <MessageSquareText size={26} />
        </div>
        <div className="text-xl font-bold">Your messages</div>
        <div className="mt-2 text-sm text-white/60">
          Select a conversation on the left, or create a new chat.
        </div>
      </div>
    </div>
  );
}


