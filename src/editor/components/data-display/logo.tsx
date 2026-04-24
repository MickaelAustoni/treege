import LogoBlack from "@/editor/assets/img/treege-black.svg";
import LogoWhite from "@/editor/assets/img/treege-white.svg";

interface LogoProps {
  theme?: "dark" | "light";
}

const Logo = ({ theme = "dark" }: LogoProps) => (
  <div className="tg:absolute tg:top-5 tg:left-5 tg:z-50 tg:select-none">
    <img
      src={theme === "dark" ? LogoWhite : LogoBlack}
      alt="Treege"
      className="tg:relative tg:h-14 tg:w-auto tg:drop-shadow-[0_0px_35px] tg:drop-shadow-blue-600"
    />
  </div>
);
export default Logo;
