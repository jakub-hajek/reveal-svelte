import type { TwoColumnLayoutProps } from '../../types/layouts';
/**
 * TwoColumnLayout - Split slide into two columns with configurable ratio
 *
 * @example
 * ```svelte
 * <TwoColumnLayout splitRatio="2fr 1fr" gap="2rem">
 *   {#snippet left()}
 *     <h2>Left Content</h2>
 *   {/snippet}
 *   {#snippet right()}
 *     <p>Right Content</p>
 *   {/snippet}
 * </TwoColumnLayout>
 * ```
 */
type Props = TwoColumnLayoutProps & {
    background?: string;
    transition?: 'slide' | 'fade' | 'convex' | 'concave' | 'zoom';
};
declare const TwoColumnLayout: import("svelte").Component<Props, {}, "">;
type TwoColumnLayout = ReturnType<typeof TwoColumnLayout>;
export default TwoColumnLayout;
