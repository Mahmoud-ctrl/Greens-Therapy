import { Droplet, FlaskRound, Flower2, Hand, Hexagon, Leaf, Pin, type LucideIcon } from "lucide-react";

const categoryVisuals: Array<{ match: RegExp; icon: LucideIcon; tone: string }> = [
    { match: /cupping|حجام/i, icon: FlaskRound, tone: "from-[#efe6cf] to-[#e3d6b3] text-[#8a6a2c]" },
    { match: /massage|تدليك|مساج/i, icon: Hand, tone: "from-[#e8ecd9] to-[#d5dcbb] text-emerald-800" },
    { match: /needl|إبر/i, icon: Pin, tone: "from-[#eae6dc] to-[#d9d2c1] text-slate-700" },
    { match: /holistic|شامل/i, icon: Flower2, tone: "from-[#efe9d8] to-[#dfe3c8] text-emerald-700" },
    { match: /honey|عسل/i, icon: Droplet, tone: "from-[#f8e7bd] to-[#efcd84] text-honey-700" },
    { match: /hive|bee|نحل|خلي/i, icon: Hexagon, tone: "from-[#f6ead0] to-[#e9d3a0] text-honey-700" },
];

const fallbackVisual = { icon: Leaf, tone: "from-[#eef0e2] to-[#dde3c6] text-emerald-700" };

/** Item image, or a tinted category illustration when the clinic hasn't uploaded one. */
export function ItemVisual({ image, alt, category, className = "" }: { image?: string; alt: string; category: string; className?: string }) {
    if (image) {
        return <img src={image} alt={alt} className={`object-cover ${className}`} />;
    }

    const { icon: Icon, tone } = categoryVisuals.find((visual) => visual.match.test(category)) ?? fallbackVisual;
    return (
        <div role="img" aria-label={alt} className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${tone} ${className}`}>
            <div aria-hidden="true" className="absolute -end-6 -top-6 h-24 w-24 rounded-full bg-white/30" />
            <div aria-hidden="true" className="absolute -bottom-8 -start-4 h-28 w-28 rounded-full bg-white/20" />
            <Icon aria-hidden="true" strokeWidth={1.25} className="relative h-12 w-12 opacity-80" />
        </div>
    );
}
