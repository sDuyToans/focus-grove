import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import type { CompanionMood } from '../types'
import '../styles/companion.css'

/**
 * AnimalCompanion — "Maple", a chubby chibi cat drawn as inline SVG and
 * animated with framer-motion. The cat uses its own color tokens
 * (declared in companion.css and tuned separately for dark mode) so its
 * eyes/outline never invert into something spooky when the theme flips.
 *
 * Moods drive the performance:
 *  idle      — gentle bob & sway, squash-and-stretch breathing,
 *              double-blinks, alternating ear twitches, lazy tail wag
 *  focus     — leans in with sparkly determined eyes, quicker breathing
 *  sleep     — happy closed eyes, slow deep breathing, floating Zzz
 *  celebrate — squishy jumps, ^ ^ eyes, paws up, confetti sparkles
 *
 * Everything collapses to a static cute pose under reduced motion.
 */

interface Props {
  mood: CompanionMood
  /** Pixel size of the square SVG stage (default 180). */
  size?: number
}

export function AnimalCompanion({ mood, size = 180 }: Props) {
  const reduced = useReducedMotion()

  const sleeping = mood === 'sleep'
  const celebrating = mood === 'celebrate'
  const focused = mood === 'focus'
  const stretching = mood === 'stretch'
  const sad = mood === 'sad'
  const eyesOpen = !sleeping && !celebrating && !stretching

  const breathDur = sleeping ? 5 : focused ? 2.4 : 3.6

  return (
    <div className="companion" style={{ width: size, height: size }} aria-hidden="true">
      <motion.svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        // whole-cat motion: cozy bob when idle, lean when focused,
        // springy squash-and-stretch jumps when celebrating
        animate={
          reduced
            ? undefined
            : celebrating
              ? {
                  y: [0, 2, -16, 0, 2, -10, 0],
                  scaleY: [1, 0.94, 1.06, 1, 0.95, 1.05, 1],
                  scaleX: [1, 1.05, 0.96, 1, 1.04, 0.97, 1],
                }
              : sleeping
                ? { y: 4, rotate: 0 }
                : stretching
                  ? { y: [0, -4, -4, 0], rotate: [0, -3, 3, 0], scaleY: [1, 1.04, 1.04, 1] }
                  : sad
                    ? { y: 3, rotate: 0 }
                    : focused
                      ? { y: 0, rotate: -2, x: 2 }
                      : { y: [0, -3, 0], rotate: [0, 1.2, 0, -1.2, 0] }
        }
        transition={
          celebrating
            ? { duration: 1.15, repeat: Infinity, repeatDelay: 0.25, ease: 'easeOut' }
            : stretching
              ? { duration: 4.4, repeat: Infinity, repeatDelay: 0.8, ease: 'easeInOut' }
              : sleeping || focused || sad
                ? { duration: 0.7, ease: 'easeInOut' }
                : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }
        }
        style={{ originX: '100px', originY: '170px' }}
      >
        {/* ground shadow */}
        <ellipse cx="100" cy="178" rx="46" ry="8" className="cat-shadow" />

        {/* tail — curls beside the body with a slow happy wag */}
        <motion.path
          d="M136 158 Q168 156 166 132 Q165 120 154 118"
          className="cat-tail"
          animate={
            reduced
              ? undefined
              : sleeping
                ? { rotate: 14 }
                : { rotate: [0, 10, 0, -4, 0] }
          }
          transition={
            sleeping
              ? { duration: 1 }
              : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
          }
          style={{ originX: '136px', originY: '158px' }}
        />
        {/* tail tip */}
        <circle cx="154" cy="118" r="7" className="cat-fur-solid" />

        {/* body — chubby pear shape with breathing squash */}
        <motion.g
          animate={reduced ? undefined : { scaleY: [1, 1.035, 1], scaleX: [1, 0.99, 1] }}
          transition={{ duration: breathDur, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '100px', originY: '176px' }}
        >
          <path
            d="M62 172 Q58 122 100 120 Q142 122 138 172 Q139 178 130 178 L70 178 Q61 178 62 172 Z"
            className="cat-fur"
          />
          {/* creamy belly */}
          <ellipse cx="100" cy="158" rx="22" ry="19" className="cat-belly" />

          {/* paws: raised "yay" when celebrating or stretching, tucked otherwise */}
          {celebrating || stretching ? (
            <g>
              <motion.ellipse
                cx="60" cy="132" rx="9" ry="12"
                className="cat-fur"
                animate={
                  reduced
                    ? undefined
                    : stretching
                      ? { rotate: [-26, -34, -26], y: [0, -3, 0] }
                      : { rotate: [-18, -34, -18] }
                }
                transition={
                  stretching
                    ? { duration: 4.4, repeat: Infinity, repeatDelay: 0.8, ease: 'easeInOut' }
                    : { duration: 0.6, repeat: Infinity }
                }
                style={{ originX: '62px', originY: '142px' }}
              />
              <motion.ellipse
                cx="140" cy="132" rx="9" ry="12"
                className="cat-fur"
                animate={
                  reduced
                    ? undefined
                    : stretching
                      ? { rotate: [26, 34, 26], y: [0, -3, 0] }
                      : { rotate: [18, 34, 18] }
                }
                transition={
                  stretching
                    ? { duration: 4.4, repeat: Infinity, repeatDelay: 0.8, ease: 'easeInOut', delay: 0.15 }
                    : { duration: 0.6, repeat: Infinity, delay: 0.08 }
                }
                style={{ originX: '138px', originY: '142px' }}
              />
            </g>
          ) : (
            <g>
              <ellipse cx="84" cy="174" rx="11" ry="7" className="cat-fur" />
              <ellipse cx="116" cy="174" rx="11" ry="7" className="cat-fur" />
              {/* toe lines */}
              <path d="M84 170 L84 176 M80 171 L80 176 M88 171 L88 176" className="cat-detail" />
              <path d="M116 170 L116 176 M112 171 L112 176 M120 171 L120 176" className="cat-detail" />
              {focused && (
                /* a tiny pencil held against the body while focusing */
                <motion.g
                  animate={reduced ? undefined : { rotate: [0, 5, 0, -3, 0] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ originX: '118px', originY: '168px' }}
                >
                  <rect x="112" y="140" width="9" height="30" rx="2.5" transform="rotate(24 118 155)" className="cat-pencil" />
                  <path d="M129 137 L136 129 L133 141 Z" className="cat-pencil-tip" transform="rotate(4 132 135)" />
                </motion.g>
              )}
            </g>
          )}
        </motion.g>

        {/* head — big and round, gently tilting */}
        <motion.g
          animate={
            reduced
              ? undefined
              : sleeping
                ? { rotate: 7, y: 8 }
                : sad
                  ? { rotate: -4, y: 5 }
                  : celebrating
                    ? { rotate: [0, -4, 4, 0] }
                    : { rotate: [0, 2.5, 0, -2.5, 0], y: 0 }
          }
          transition={
            sleeping || sad
              ? { duration: 0.9, ease: 'easeInOut' }
              : celebrating
                ? { duration: 1.15, repeat: Infinity, repeatDelay: 0.25 }
                : { duration: 6, repeat: Infinity, ease: 'easeInOut' }
          }
          style={{ originX: '100px', originY: '110px' }}
        >
          {/* ears — soft rounded triangles, twitching one at a time
              (drooped outward when Maple is feeling wistful) */}
          <motion.path
            d="M56 70 Q48 34 60 32 Q72 32 84 50 Q68 54 56 70 Z"
            className="cat-fur"
            animate={
              reduced || sleeping ? undefined : sad ? { rotate: -16 } : { rotate: [0, 0, -8, 0] }
            }
            transition={
              sad
                ? { duration: 0.6 }
                : { duration: 0.5, repeat: Infinity, repeatDelay: 5.5, ease: 'easeOut' }
            }
            style={{ originX: '68px', originY: '58px' }}
          />
          <motion.path
            d="M144 70 Q152 34 140 32 Q128 32 116 50 Q132 54 144 70 Z"
            className="cat-fur"
            animate={
              reduced || sleeping ? undefined : sad ? { rotate: 16 } : { rotate: [0, 0, 8, 0] }
            }
            transition={
              sad
                ? { duration: 0.6 }
                : { duration: 0.5, repeat: Infinity, repeatDelay: 7.3, ease: 'easeOut' }
            }
            style={{ originX: '132px', originY: '58px' }}
          />
          <path d="M62 60 Q59 42 66 41 Q72 42 78 52 Q69 54 62 60 Z" className="cat-ear-inner" />
          <path d="M138 60 Q141 42 134 41 Q128 42 122 52 Q131 54 138 60 Z" className="cat-ear-inner" />

          {/* face — wide rounded head */}
          <ellipse cx="100" cy="92" rx="52" ry="46" className="cat-fur" />

          {/* forehead stripes */}
          <path d="M92 48 Q94 56 92 60 M100 46 Q102 55 100 60 M108 48 Q106 56 108 60" className="cat-stripe" />

          {/* eyes */}
          {eyesOpen ? (
            <motion.g
              // occasional cute double-blink
              animate={reduced ? undefined : { scaleY: [1, 0.06, 1, 0.06, 1, 1] }}
              transition={{
                duration: 0.7,
                times: [0, 0.15, 0.3, 0.45, 0.6, 1],
                repeat: Infinity,
                repeatDelay: 4.2,
                ease: 'easeInOut',
              }}
              style={{ originX: '100px', originY: '92px' }}
            >
              <ellipse cx="80" cy={sad ? 94 : 92} rx={sad ? 8 : 9} ry={focused ? 9.5 : sad ? 8.5 : 11} className="cat-eye" />
              <ellipse cx="120" cy={sad ? 94 : 92} rx={sad ? 8 : 9} ry={focused ? 9.5 : sad ? 8.5 : 11} className="cat-eye" />
              {/* big soft shines make the eyes friendly */}
              <circle cx="83" cy={sad ? 91 : 88} r="3.4" className="cat-shine" />
              <circle cx="123" cy={sad ? 91 : 88} r="3.4" className="cat-shine" />
              <circle cx="77.5" cy="95" r="1.6" className="cat-shine cat-shine-soft" />
              <circle cx="117.5" cy="95" r="1.6" className="cat-shine cat-shine-soft" />
              {focused && (
                /* determined little brows */
                <g className="cat-detail">
                  <path d="M72 78 Q80 75 88 78" />
                  <path d="M112 78 Q120 75 128 78" />
                </g>
              )}
              {sad && (
                /* soft raised inner brows — wistful, not miserable */
                <g className="cat-detail">
                  <path d="M72 80 Q80 78 87 82" />
                  <path d="M113 82 Q120 78 128 80" />
                </g>
              )}
            </motion.g>
          ) : (
            /* closed eyes: ^ ^ celebrating, relaxed ⌣ ⌣ asleep/stretching */
            <g className="cat-closed-eye">
              <path d={celebrating ? 'M71 93 Q80 84 89 93' : 'M71 91 Q80 97 89 91'} />
              <path d={celebrating ? 'M111 93 Q120 84 129 93' : 'M111 91 Q120 97 129 91'} />
            </g>
          )}

          {/* blush */}
          <ellipse cx="63" cy="104" rx="8" ry="5" className="cat-blush" />
          <ellipse cx="137" cy="104" rx="8" ry="5" className="cat-blush" />

          {/* tiny nose + ω mouth (a small hum when wistful) */}
          <path d="M96.5 103 Q100 100.5 103.5 103 Q100 107 96.5 103 Z" className="cat-nose" />
          <path
            d={
              celebrating
                ? 'M90 108 Q95 116 100 110 Q105 116 110 108'
                : sad
                  ? 'M94 110 Q100 108 106 110'
                  : 'M92 108 Q96 112 100 108 Q104 112 108 108'
            }
            className="cat-mouth"
          />

          {/* whiskers — short and soft */}
          <g className="cat-whisker">
            <path d="M52 96 Q42 94 36 91" />
            <path d="M53 103 Q43 104 37 106" />
            <path d="M148 96 Q158 94 164 91" />
            <path d="M147 103 Q157 104 163 106" />
          </g>
        </motion.g>

        {/* floating Zzz while asleep */}
        <AnimatePresence>
          {sleeping && !reduced && (
            <motion.g
              key="zzz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="cat-zzz"
            >
              {[0, 1, 2].map((i) => (
                <motion.text
                  key={i}
                  x={148 + i * 11}
                  y={54 - i * 15}
                  fontSize={17 - i * 3}
                  animate={{ y: [0, -9], opacity: [0, 1, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }}
                >
                  z
                </motion.text>
              ))}
            </motion.g>
          )}
        </AnimatePresence>

        {/* celebration sparkles + hearts */}
        <AnimatePresence>
          {celebrating && !reduced && (
            <motion.g key="sparkles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {[
                { x: 34, y: 44, d: 0 },
                { x: 168, y: 38, d: 0.3 },
                { x: 26, y: 112, d: 0.55 },
                { x: 174, y: 100, d: 0.15 },
                { x: 100, y: 16, d: 0.45 },
              ].map((s, i) => (
                <motion.path
                  key={i}
                  d={`M${s.x} ${s.y - 6} Q${s.x + 1.5} ${s.y - 1.5} ${s.x + 6} ${s.y} Q${s.x + 1.5} ${s.y + 1.5} ${s.x} ${s.y + 6} Q${s.x - 1.5} ${s.y + 1.5} ${s.x - 6} ${s.y} Q${s.x - 1.5} ${s.y - 1.5} ${s.x} ${s.y - 6} Z`}
                  className="cat-sparkle"
                  animate={{ scale: [0, 1.2, 0], rotate: [0, 45] }}
                  transition={{ duration: 1.3, repeat: Infinity, delay: s.d }}
                  style={{ originX: `${s.x}px`, originY: `${s.y}px` }}
                />
              ))}
              {/* two floating hearts */}
              {[{ x: 52, y: 30, d: 0.2 }, { x: 150, y: 66, d: 0.7 }].map((h, i) => (
                <motion.path
                  key={`h${i}`}
                  d={`M${h.x} ${h.y + 4} Q${h.x - 6} ${h.y - 2} ${h.x - 2.5} ${h.y - 5} Q${h.x} ${h.y - 7} ${h.x} ${h.y - 3.5} Q${h.x} ${h.y - 7} ${h.x + 2.5} ${h.y - 5} Q${h.x + 6} ${h.y - 2} ${h.x} ${h.y + 4} Z`}
                  className="cat-heart"
                  animate={{ y: [0, -12], opacity: [0, 1, 0], scale: [0.7, 1.1] }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: h.d, ease: 'easeOut' }}
                />
              ))}
            </motion.g>
          )}
        </AnimatePresence>
      </motion.svg>
    </div>
  )
}
