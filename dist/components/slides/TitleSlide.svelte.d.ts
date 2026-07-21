import type { TitleSlideProps } from '../../types/layouts';
import type { FooterConfig } from '../../types/slides.js';
interface Props extends TitleSlideProps {
    footerConfig?: FooterConfig;
}
declare const TitleSlide: import("svelte").Component<Props, {}, "">;
type TitleSlide = ReturnType<typeof TitleSlide>;
export default TitleSlide;
