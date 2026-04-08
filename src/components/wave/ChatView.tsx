import React, { useState, useEffect, useRef } from 'react';
// ...
const ChatView = ({ chatId }: Props) => {
   // ...
   const [replyId, setReplyId] = useState<string | null>(null);
   const [replyMessage, setReplyMessage] = useState<MessageRow | null>(null);
   const [showReplyPreview, setShowReplyPreview] = useState(false);
   // ...
   const handleReply = (msg: MessageRow) => {
      setReplyId(msg.id);
      setReplyMessage(msg);
      setShowReplyPreview(true);
   };
   // ...
   return (
      // ...
      {showReplyPreview && (
         <div className="fixed bottom-16 left-0 right-0 bg-card py-2 px-4 flex items-center gap-2 border-t border-border">
            <div className="bg-gray-100 h-4 w-1 rounded-lg" /> // Barra vertical colorida
            <div className="flex-1">
               <p className="font-bold text-sm mb-0.5 block">{replyMessage?.senderName}</p>
               <p className="text-sm truncate w-64">{replyMessage?.content}</p>
            </div>
            <button onClick={() => {
               setReplyId(null);
               setReplyMessage(null);
               setShowReplyPreview(false);
            }} className="p-1 hover:bg-muted rounded text-muted-foreground">
               <X className="w-4 h-4" />
            </button>
         </div>
      )}
      // ...
      <div className="border-t border-border bg-card px-4 py-3 flex items-center gap-2 shrink-0">
         // ...
         <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendReply(replyId)}
            placeholder="Digite as mensagens"
            className="flex-1 h-9 bg-wave-input-bg border-border text-sm"
         />
         <button onClick={() => handleSendReply(replyId)} className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <Send className="w-4 h-4" />
         </button>
      </div>
   );
};
// ...
const handleSendReply = async (replyId: string | null) => {
   if (!message.trim() || !user) return;
   const content = message.trim();
   setMessage("");
   await supabase.from("messages").insert({ channel_id: chatId, sender_id: user.id, content, reply_id: replyId });
};