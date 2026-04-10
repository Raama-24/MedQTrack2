import { motion } from "framer-motion";
import VoiceTriage from "./VoiceTriage";

const features = [
  "Real-time Queue",
  "Bed Availability",
  "Smart Dashboards",
  "Check Token Status",
];

export default function HeroSection() {
  return (
    <div className="relative h-[90vh] w-full overflow-hidden">

      {/* Background */}
      <div
        className="absolute -inset-[0.5%] bg-cover bg-bottom"
        style={{ backgroundImage: "url('/bg3.png')" }}
      />

      {/* Content */}
      <div className="relative z-10 flex h-full items-center px-12 md:px-20">
        <div className="max-w-4xl">

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: -220, z: -600, letterSpacing: "-0.5em" }}
            animate={{ opacity: 1, y: 0, z: 0, letterSpacing: "0em" }}
            transition={{ duration: 2.0, ease: [0.215, 0.61, 0.355, 1] }} // SLOWER
            className="text-6xl md:text-8xl font-bold text-white tracking-tight"
            style={{ textShadow: "0 10px 30px rgba(0,0,0,0.5)", transformPerspective: 1000 }}
          >
            Med<span className="text-blue-400">Q</span>Track
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 160, z: -500, letterSpacing: "-0.4em" }}
            animate={{ opacity: 1, y: 0, z: 0, letterSpacing: "0em" }}
            transition={{ delay: 2.2, duration: 1.5, ease: [0.215, 0.61, 0.355, 1] }} // SLOWER & delayed
            className="mt-6 text-2xl md:text-3xl lg:text-4xl font-medium text-white whitespace-nowrap leading-tight"
            style={{ transformPerspective: 1000 }}
          >
            Healthcare Operations, Done Right
          </motion.p>

          {/* Features */}
          <motion.ul
            className="mt-16 flex flex-wrap items-center gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.5, delayChildren: 4.0 } }, // SLOWER
            }}
          >
            {features.map((feature) => (
              <motion.li
                key={feature}
                className="flex items-center gap-2 text-white/90"
                variants={{
                  hidden: { opacity: 0, letterSpacing: "1em" },
                  visible: { opacity: 1, letterSpacing: "0em" },
                }}
                transition={{ duration: 1.0, ease: [0.215, 0.61, 0.355, 1] }} // SLOWER
              >
                <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                <span className="text-base md:text-lg whitespace-nowrap">{feature}</span>
              </motion.li>
            ))}
          </motion.ul>

          {/* Voice Triage Button and Shortcut */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 5.5, duration: 1.0 }}
            className="mt-16 flex flex-col items-start gap-4"
          >
            <VoiceTriage />
            <p className="text-white/60 text-sm font-medium tracking-wide animate-pulse">
              Press <kbd className="bg-white/10 px-2 py-1 rounded border border-white/20 text-white">Alt + V</kbd> to start voice triage.
            </p>
          </motion.div>




        </div>
      </div>
    </div>
  );
}
