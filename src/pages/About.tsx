import { Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { BookOpen, Search, Sparkles, Globe, Shield, Scale } from 'lucide-react';

import { Layout } from '@/components/Layout';
import { LogoMark } from '@/components/LogoMark';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ENGINE_PROFILE } from '@/lib/engine/profile';

const engine = ENGINE_PROFILE;

export default function About() {
  useSeoMeta({
    title: `About - ${engine.branding.name}`,
    description: engine.branding.description,
  });

  return (
    <Layout>
      <div className="container max-w-2xl py-12">
        <div className="flex items-center gap-3 mb-3">
          <LogoMark className="w-10 h-10" />
          <h1 className="text-3xl font-serif font-semibold tracking-tight">About {engine.branding.name}</h1>
        </div>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          {engine.branding.slogan}
        </p>

        <Separator className="mb-8" />

        <section className="mb-10">
          <h2 className="text-xl font-serif font-semibold mb-3">What SAVEDD is</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            SAVEDD is a Christian community search engine. It is built for people who want to
            search the open web — sermons, Scripture study, church history, news, and ordinary
            questions — without pretending that a search box is a pastor, a denomination, or a
            source of revelation.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            It exists because communities should be able to run their own search engines on
            shared, open infrastructure rather than depending on a single company&apos;s ranking
            of the world. SAVEDD is the first proof of that idea: one search core, one
            decentralized index protocol, many independently branded engines.
          </p>
        </section>

        <div className="grid gap-3 mb-10">
          {[
            {
              icon: <Search className="w-4 h-4 text-primary" />,
              title: 'Christian-focused discovery',
              body: 'The product is oriented toward Christian users — in presentation, curated Scripture on the homepage, and an AI assistant instructed to handle theological questions with care. General web search remains useful. There is no keyword blacklist pretending to be theology.',
            },
            {
              icon: <Sparkles className="w-4 h-4 text-primary" />,
              title: 'AI-assisted answers',
              body: 'Optional AI answers synthesize from the search results in front of you. They cite sources. They do not invent Bible quotations. They distinguish Scripture from interpretation, and they are not indexed as if they were web pages.',
            },
            {
              icon: <Globe className="w-4 h-4 text-primary" />,
              title: 'Brave web search',
              body: 'Clearnet results can come from Brave Search (when the operator or you have configured a key) alongside other privacy-respecting engines. The API key never ships in the browser bundle.',
            },
            {
              icon: <BookOpen className="w-4 h-4 text-primary" />,
              title: 'A shared decentralized index',
              body: 'SAVEDD also searches SIP-01, an open web-document index that anyone can crawl, index, and relay. Pages discovered here can contribute back to that shared index. SAVEDD does not invent a separate Christian blockchain.',
            },
          ].map((item) => (
            <Card key={item.title} className="border-border/60">
              <CardContent className="py-5 px-5 flex gap-3">
                <span className="mt-0.5 shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20">
                  {item.icon}
                </span>
                <div>
                  <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="mb-10">
          <h2 className="text-xl font-serif font-semibold mb-3 flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Scripture and interpretation
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            When a question is theological, SAVEDD&apos;s AI is instructed to prioritize
            Scripture where the evidence includes it, identify chapter and verse accurately,
            and never fabricate a quotation. Biblical text is distinguished from commentary
            and from the model&apos;s own inference.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Christianity is not one denomination. Legitimate differences are acknowledged.
            Mainstream historic consensus is not presented as if it were the only Christian
            view, and a minority interpretation is not presented as Scripture itself.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The AI is an assistant for Christian search. It is not a religious authority,
            does not claim divine revelation, and should say so when the evidence is weak.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-serif font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Truthful sourcing
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Search results show title, address, and snippet from the engines that returned
            them. AI answers must cite the evidence they used. SAVEDD does not invent
            sources. If a result is missing, the honest answer is that it is missing.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="text-xl font-serif font-semibold mb-3">Open search infrastructure</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Underneath the SAVEDD interface is an open search stack: a shared SIP-01
            document index, community crawlers and indexers, and a structured query engine.
            That stack is not owned by SAVEDD. Other communities can launch their own
            engines on the same foundation.
          </p>
          <p className="text-sm text-muted-foreground">
            Protocol:{' '}
            <a
              href="https://github.com/NostrDanish/Dsearch/blob/main/docs/SIP-01.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              SIP-01
            </a>
            {' · '}
            <Link to="/settings" className="text-primary hover:underline">Settings</Link>
            {' · '}
            <a
              href="https://shakespeare.diy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Vibed with Shakespeare
            </a>
          </p>
        </section>
      </div>
    </Layout>
  );
}
