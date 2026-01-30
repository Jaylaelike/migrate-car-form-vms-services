"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "motion/react";

export default function CountUp({
    to,
    from = 0,
    direction = "up",
    delay = 0,
    duration = 2,
    className = "",
    startWhen = true,
    separator = "",
    onStart,
    onEnd,
}: {
    to: number;
    from?: number;
    direction?: "up" | "down";
    delay?: number;
    duration?: number;
    className?: string;
    startWhen?: boolean;
    separator?: string;
    onStart?: () => void;
    onEnd?: () => void;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(direction === "down" ? to : from);
    const springValue = useSpring(motionValue, {
        damping: 60,
        stiffness: 100,
        duration: duration * 1000,
    });
    const isInView = useInView(ref, { once: true, margin: "0px" });

    useEffect(() => {
        if (isInView && startWhen) {
            if (typeof onStart === "function") {
                onStart();
            }

            const timeoutId = setTimeout(() => {
                motionValue.set(direction === "down" ? from : to);
            }, delay * 1000);

            const durationTimeoutId = setTimeout(() => {
                if (typeof onEnd === "function") {
                    onEnd();
                }
            }, delay * 1000 + duration * 1000);

            return () => {
                clearTimeout(timeoutId);
                clearTimeout(durationTimeoutId);
            };
        }
    }, [isInView, startWhen, motionValue, direction, from, to, delay, onStart, onEnd, duration]);

    useEffect(() => {
        const checkIsInt = Number.isInteger(to);
        const unsubscribe = springValue.on("change", (latest) => {
            if (ref.current) {
                if (checkIsInt) {
                    ref.current.textContent = Intl.NumberFormat("en-US").format(
                        Number(latest.toFixed(0))
                    ).replace(/,/g, separator);
                } else {
                    ref.current.textContent = Intl.NumberFormat("en-US").format(
                        Number(latest.toFixed(2))
                    ).replace(/,/g, separator);
                }

            }
        });

        return () => unsubscribe();
    }, [springValue, separator, to]);

    return <span className={className} ref={ref} />;
}
