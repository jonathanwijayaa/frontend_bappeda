import type { ReactNode } from "react";
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface CardProps {
  children: ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  title?: ReactNode;
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  collapsible = false,
  defaultCollapsed = false,
  title,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className={`bg-white rounded-lg shadow-sm h-full flex flex-col ${className}`}>
      {title && (
        <div
          className={`px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0 ${
            collapsible ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""
          }`}
          onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
        >
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          {collapsible && (
            <button
              className="text-gray-400 hover:text-gray-600 transition-transform duration-300"
              style={{ transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)" }}
            >
              <ChevronDown size={20} />
            </button>
          )}
        </div>
      )}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out flex-grow ${
          isCollapsed ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
        }`}
      >
        <div className="p-6 h-full">{children}</div>
      </div>
    </div>
  );
};

export default Card;
