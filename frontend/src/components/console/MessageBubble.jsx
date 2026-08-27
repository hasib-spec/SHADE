import React from 'react';

/**
 * Formats and renders individual messages in the God Mode Console.
 */
const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-2`}>
      <div className="text-xs text-gray-500 mb-1">
        {isUser ? 'OPERATOR' : 'SHADE_SYS'} [{new Date(message.timestamp).toLocaleTimeString()}]
      </div>
      <div className={`max-w-[90%] p-3 rounded ${
        isUser 
          ? 'bg-white/10 text-white rounded-br-none' 
          : 'bg-shade-dark border border-shade-border text-gray-300 rounded-bl-none shadow-lg'
      }`}>
        <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
