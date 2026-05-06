import { forwardRef } from "react";

type CardVariant = "default" | "dark" | "cream";
type CardPadding = "sm" | "md" | "lg";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hover?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  default: "bg-white border border-ink/8",
  dark: "bg-[#1C1917] border border-white/6",
  cream: "bg-cream border border-ink/8",
};

const paddingClasses: Record<CardPadding, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "default",
      padding = "md",
      hover = false,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={[
          "rounded-xl",
          variantClasses[variant],
          paddingClasses[padding],
          hover
            ? "transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
            : "",
          className,
        ].join(" ")}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
