"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PlusIcon } from "lucide-react";
import { Button } from "../ui/button";
import { trackEvent } from "aurea-tracking-sdk";

const faqs = [
  {
    title: "What do I get in Tom's Trading Room?",
    description: () => (
      <>
        <p>
          You get access to comprehensive trading education, including live
          trading sessions, pre-recorded courses, and a supportive community.
        </p>
        <p>
          Everything you need to{" "}
          <span className="text-white font-medium">
            pass prop firm challenges
          </span>{" "}
          and build{" "}
          <span className="text-white font-medium">
            successful trading accounts.
          </span>
        </p>
      </>
    ),
  },
  {
    title: "Is the content live or pre-recorded?",
    description: () => (
      <>
        <p>We offer both live and pre-recorded content.</p>
        <p>
          Access a library of{" "}
          <span className="text-white font-medium">
            pre-recorded educational materials
          </span>{" "}
          you can watch at your own pace, plus{" "}
          <span className="text-white font-medium">
            live trading sessions and Q&A calls
          </span>{" "}
          where you interact directly with Tom and the community.
        </p>
      </>
    ),
  },
  {
    title: "How long is the program?",
    description: () => (
      <>
        <p>
          The program is designed to be completed within{" "}
          <span className="text-white font-medium">6 months,</span> though
          you'll have ongoing access to the community and resources.
        </p>
        <p>
          The timeline is{" "}
          <span className="text-white font-medium">
            flexible based on your dedication
          </span>{" "}
          and pace of learning.
        </p>
      </>
    ),
  },
  {
    title: "Do I need any startup capital?",
    description: () => (
      <>
        <p>
          No, you don't need significant startup capital. We focus on teaching
          you to pass prop firm challenges.
        </p>
        <p>
          This allows you to{" "}
          <span className="text-white font-medium">
            trade with the firm's capital
          </span>{" "}
          rather than your own. You'll just need enough to cover challenge fees,
          which can be{" "}
          <span className="text-white font-medium">
            as low as a few hundred dollars.
          </span>
        </p>
      </>
    ),
  },
  {
    title: "How long will it take me to make money?",
    description: () => (
      <>
        <p>
          This varies based on your dedication, learning pace, and consistency.
        </p>
        <p>
          Some members pass their first prop firm challenge{" "}
          <span className="text-white font-medium">
            within the first few months,
          </span>{" "}
          while others take longer. The key is{" "}
          <span className="text-white font-medium">
            following the structured approach
          </span>{" "}
          and staying disciplined with your trading plan.
        </p>
      </>
    ),
  },
  {
    title: "Can I do this if I'm under 18?",
    description: () => (
      <>
        <p>
          While you can join the community and learn the strategies at any age,
          most prop firms require you to be{" "}
          <span className="text-white font-medium">18 or older</span> to
          participate in their challenges and receive payouts.
        </p>
        <p>
          We recommend using the time before 18 to{" "}
          <span className="text-white font-medium">learn and practice.</span>
        </p>
      </>
    ),
  },
  {
    title: "How can I pay?",
    description: () => (
      <>
        <p>
          We accept all major payment methods including{" "}
          <span className="text-white font-medium">
            credit cards, debit cards, and PayPal.
          </span>
        </p>
        <p>
          <span className="text-white font-medium">Payment plans</span> are also
          available to make the program more accessible.
        </p>
      </>
    ),
  },
  {
    title: "Can I do this if I'm still in school / university?",
    description: () => (
      <>
        <p>
          Absolutely! Many of our successful members are students. The program
          is designed to be{" "}
          <span className="text-white font-medium">flexible</span> and can be
          completed alongside your studies.
        </p>
        <p>
          You can{" "}
          <span className="text-white font-medium">learn at your own pace</span>{" "}
          and apply the strategies when your schedule allows.
        </p>
      </>
    ),
  },
];

const FAQ = () => {
  const [openIndexes, setOpenIndexes] = useState<boolean[]>([]);
  const [faqOpenCount, setFaqOpenCount] = useState(0);

  const toggle = (i: number) => {
    setOpenIndexes((prev) => {
      const newArr = [...prev];
      newArr[i] = !newArr[i];

      // Track FAQ interaction
      if (!prev[i]) {
        const newCount = faqOpenCount + 1;
        setFaqOpenCount(newCount);
        
        // Use new SDK trackEvent if available
        if (typeof window !== 'undefined' && (window as any).aureaSDK) {
          // Track individual FAQ open
          (window as any).aureaSDK.trackEvent("faq_opened", {
            question: faqs[i].title,
            questionIndex: i,
            totalFaqsOpened: newCount
          });
          
          // If user opened 3+ FAQs, they're really researching!
          if (newCount >= 3) {
            (window as any).aureaSDK.trackEvent("faq_multiple_opened", {
              count: newCount
            });
          }
        } else {
          // Fallback to old method
          trackEvent("faq_opened", {
            question: faqs[i].title,
            questionIndex: i,
          });
        }
      }

      return newArr;
    });
  };

  return (
    <div
      id="faqs"
      className="min-h-screen h-full flex flex-col gap-8 md:gap-48 py-12 md:grid md:grid-cols-4 md:py-32 relative max-w-7xl mx-auto px-8"
    >
      <div className="w-full md:w-[16rem] h-full">
        <div className="space-y-4 md:space-y-6 md:sticky md:top-4">
          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-[-0.15rem]">TTR</h1>

            <h2 className="text-lg md:text-xl font-semibold leading-6 md:leading-7 md:w-[20ch]">
              Don't see the answer you're looking for?
            </h2>
          </div>

          <Button
            className="w-full flex justify-between py-6 md:py-6 px-4! md:pl-6! md:pr-4! rounded-xl bg-white/5 hover:bg-white/10 transition duration-250 tracking-tight text-sm md:text-base"
            asChild
            variant="gradient"
            onClick={() => {
              trackEvent("contact_clicked", {
                source: "faq_section",
              });
            }}
          >
            <Link href="mailto:contact@tomstradingroom.com">
              Get in touch
              <span className="ml-2">→</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:col-span-3 gap-y-6 md:gap-y-10">
        <div className="flex flex-col gap-y-2">
          {faqs.map((faq, i) => {
            const opened = openIndexes[i];

            return (
              <motion.div
                key={faq.title}
                layout
                onClick={() => toggle(i)}
                className={`px-4 md:px-8 py-4 md:py-8 rounded-xl flex flex-col gap-3 md:gap-4 cursor-pointer transition-colors duration-300 ${
                  opened ? "bg-white/5 text-white" : "bg-white/2 text-white/75"
                }`}
              >
                <div className="flex items-start gap-3 md:gap-6">
                  <div className="py-1 shrink-0">
                    <PlusIcon
                      className={`size-3.5 md:size-4 transition-transform duration-600 ${
                        opened ? "rotate-45 text-white" : "rotate-0"
                      }`}
                    />
                  </div>

                  <div className="flex flex-col gap-2 md:gap-3 flex-1 min-w-0">
                    <h3
                      className={`transition duration-200 text-sm md:text-base ${
                        opened ? "text-white" : "text-white/75"
                      }`}
                    >
                      {faq.title}
                    </h3>

                    <AnimatePresence initial={false}>
                      {opened && (
                        <motion.div
                          key="content"
                          layout="position"
                          initial={{ opacity: 0, y: 25, maxHeight: 0 }}
                          animate={{ opacity: 1, y: 0, maxHeight: 500 }}
                          exit={{ opacity: 0, y: 25, maxHeight: 0 }}
                          transition={{
                            duration: 0.65,
                            ease: [0.4, 0, 0.2, 1],
                          }}
                          style={{ overflow: "hidden" }}
                          className="w-full"
                        >
                          <div className="text-xs md:text-sm leading-relaxed space-y-1 text-white/50 wrap-break-word">
                            <faq.description />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
