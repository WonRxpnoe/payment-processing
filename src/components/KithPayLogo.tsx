export type KithPayLogoProps = {
  width?: number | string;
  height?: number | string;
  className?: string;
  variant?: "full" | "mark";
};

const SOURCES = {
  full: "/brand/kithpay-logo.svg",
  mark: "/brand/kithpay-mark.svg",
} as const;

export function KithPayLogo({
  width,
  height,
  className,
  variant = "full",
}: KithPayLogoProps) {
  const isMark = variant === "mark";

  return (
    <img
      src={SOURCES[isMark ? "mark" : "full"]}
      width={width ?? (height == null ? (isMark ? 72 : 320) : undefined)}
      height={height}
      className={className}
      alt="KithPay"
    />
  );
}
