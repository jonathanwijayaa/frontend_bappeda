import type { ButtonHTMLAttributes } from "react";
import React from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: "lg" | "md" | "sm";
  variant?: "danger" | "outline" | "primary" | "secondary";
}

const Button: React.FC<ButtonProps> = ({
  children,
  className = "",
  size = "md",
  variant = "primary",
  ...props
}) => {
  const baseStyles =
    "font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2";

  const variants = {
    danger: "bg-transparent hover:bg-red-50 text-red-600 border border-red-500",
    outline: "bg-transparent hover:bg-blue-100 text-gray-700 border border-blue-500",
    primary: "bg-blue-500 hover:bg-blue-600 text-white",
    secondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-400",
  };

  const sizes = {
    lg: "px-6 py-3 text-base",
    md: "px-4 py-2 text-sm",
    sm: "px-3 py-1.5 text-sm",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
