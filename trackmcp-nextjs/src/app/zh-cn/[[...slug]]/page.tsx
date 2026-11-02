import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, ExternalLink, ShieldCheck, Activity, Wrench, Users, Route } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { PageFrame } from "@/components/PageFrame";
import { chinesePageMeta, chinesePath, type ChineseSeoPath } from "@/lib/chinese-seo";
import { SITE_URL, serializeJsonLd } from "@/lib/seo";

type ChinesePage = {
  path: ChineseSeoPath;
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  intro: string;
  sections: Array<{ heading: string; body: string; bullets?: string[] }>;
  related: Array<{ label: string; href: string }>;
};

const pages: Record<ChineseSeoPath, ChinesePage> = {
  "/": {
    path: "/",
    title: "TrackMCP：MCP 服务器分析与可观测性",
    description: "TrackMCP 帮助团队了解 MCP 服务器的连接、工具调用、错误、延迟和明确的工作流结果。面向生产环境的 MCP 分析与可观测性。",
    eyebrow: "MCP 服务器分析",
    heading: "了解 MCP 服务器正在被如何使用",
    intro: "TrackMCP 在 MCP 服务器边界记录可验证的使用信号：哪些客户端连接、发现了哪些工具、调用在哪里变慢或失败，以及哪些明确的工作流结果被发送回来。",
    sections: [
      { heading: "从传输成功走向应用证据", body: "HTTP 200 只能说明网络请求完成。MCP 工具结果可能在成功的传输中携带应用错误。TrackMCP 将客户端、会话、工具、结果状态、延迟、重试和明确的工作流事件分开记录，避免把传输成功误认为业务完成。" },
      { heading: "为隐私和可靠性设计", body: "在服务器进程内完成敏感字段的过滤，只发送实现分析目标所需要的最小元数据。遥测异步发送，服务端在遥测不可用时继续提供服务。", bullets: ["记录服务器边界，而不是声称看到了模型的私有思考过程。", "保留工具结果状态与网络错误之间的区别。", "通过 TypeScript 和 Python SDK 接入现有 MCP 服务器。"] },
      { heading: "从一个真实工作流开始", body: "先接入一个服务器、一个 API key 和一个真实工作流，再根据观察到的证据决定下一项修复。", bullets: ["查看服务器分析", "运行 MCP 健康检查", "阅读 MCP 协议和 SDK 文档"] },
    ],
    related: [
      { label: "MCP 服务器分析", href: chinesePath("/mcp-server-analytics") },
      { label: "MCP 可观测性", href: chinesePath("/mcp-observability") },
      { label: "中文文档", href: chinesePath("/docs") },
    ],
  },
  "/mcp-observability": {
    path: "/mcp-observability",
    title: "MCP 可观测性：服务器与 Agent 工作流 | TrackMCP",
    description: "了解 MCP 客户端连接、工具发现、会话、错误、延迟、重试和明确工作流结果。TrackMCP 提供面向服务器边界的 MCP 可观测性。",
    eyebrow: "MCP 可观测性",
    heading: "知道观察到的路径在哪里停止",
    intro: "从客户端连接到工具结果，再到明确的工作流信号，TrackMCP 帮助 MCP 团队理解一个请求经过了什么，以及证据在哪里中断。",
    sections: [
      { heading: "连接、发现、执行和会话", body: "连接信号回答谁连接、使用什么传输和协议版本。发现信号回答客户端看到了哪些工具。执行信号记录工具调用的持续时间和结果状态。会话信号帮助定位有序工作流变慢或停止的位置。" },
      { heading: "绿色传输不代表应用成功", body: "MCP 工具结果可以在 HTTP 200 中携带 isError 或其他应用层失败信号。因此要分开观察传输状态、工具结果和明确的工作流终态。只有应用显式发出结果事件时，才应该声明工作流完成。" },
      { heading: "可观测性边界", body: "TrackMCP 观察 MCP 服务器边界。它不会因为服务器遥测而自动看到宿主模型的私有推理过程。若要关联客户端侧信息，需要单独的客户端集成。", bullets: ["在本地脱敏提示词、参数和结果。", "使用稳定但不包含秘密的关联 ID。", "记录采样、丢弃和不可见字段的边界。"] },
    ],
    related: [
      { label: "服务器分析", href: chinesePath("/mcp-server-analytics") },
      { label: "远程 HTTP MCP", href: "/mcp-observability/remote-http" },
      { label: "安全说明", href: "/security" },
    ],
  },
  "/mcp-server-analytics": {
    path: "/mcp-server-analytics",
    title: "MCP 服务器分析与可观测性 | TrackMCP",
    description: "TrackMCP 是面向 MCP 服务器的隐私感知分析与可观测性工具。观察客户端、工具、会话、错误、延迟、重试和明确的工作流信号。",
    eyebrow: "MCP 服务器分析",
    heading: "看见 MCP 服务器实际被如何使用",
    intro: "了解服务器看到的信号：客户端、工具、协议事件、经过脱敏的元数据、延迟、错误和明确的工作流结果。",
    sections: [
      { heading: "三个运营问题", body: "谁在连接？哪些工具形成了真实需求？第一个失败、重试循环、慢依赖或 200 响应中的应用错误发生在哪里？服务器分析应该直接回答这些问题，并标注数据边界。" },
      { heading: "从信号到决定", body: "将协议层发生的事情连接到产品问题：谁尝试了、在哪里停止、哪些修复值得优先处理。不要把工具调用次数直接称为偏好、需求或完成率。" },
      { heading: "接入方式", body: "在已经运行的服务器边界添加 SDK 包装器，在本地过滤敏感字段，异步发送最小化元数据。TypeScript 和 Python 快速开始文档提供了可复制的接入路径。", bullets: ["TypeScript SDK", "Python SDK", "异步发送和 fail-open 行为", "明确的隐私和删除边界"] },
    ],
    related: [
      { label: "快速开始", href: "/mcp-server-analytics/quickstart" },
      { label: "工具分析", href: chinesePath("/mcp-tool-analytics") },
      { label: "TypeScript 文档", href: chinesePath("/docs/typescript") },
      { label: "Python 文档", href: chinesePath("/docs/python") },
    ],
  },
  "/mcp-tool-analytics": {
    path: "/mcp-tool-analytics",
    title: "MCP 工具分析：调用、错误与使用路径 | TrackMCP",
    description: "使用 TrackMCP 观察 MCP 工具被发现、调用、重试和返回结果的方式，区分服务器信号、工具结果和工作流终态。",
    eyebrow: "MCP 工具分析",
    heading: "了解 Agent 真正调用了哪些工具",
    intro: "工具目录说明服务器声明了什么，工具分析说明授权客户端实际调用了什么。两者结合后，团队才能看见能力与使用之间的差距。",
    sections: [
      { heading: "发现不等于使用", body: "把广告目录、实时探测和授权流量分开保存。一个工具出现在 catalog 中，不代表它在每个环境都可用；一次调用也不代表用户偏好或最终任务完成。" },
      { heading: "保留正确的错误语义", body: "服务器异常、传输错误、工具结果中的 isError、超时、取消和重试是不同事件。把它们合并成一个错误率，会让排障和优先级判断失真。" },
      { heading: "用关联 ID 连接上下文", body: "使用不包含秘密的稳定 ID，把客户端、会话、工具、目录版本和明确工作流结果关联起来。对不可见字段保留原因，而不是把未知当成空值。" },
    ],
    related: [
      { label: "服务器分析", href: chinesePath("/mcp-server-analytics") },
      { label: "MCP 可观测性", href: chinesePath("/mcp-observability") },
      { label: "MCP 工具目录", href: chinesePath("/free-mcp-servers") },
    ],
  },
  "/free-mcp-servers": {
    path: "/free-mcp-servers",
    title: "免费 MCP 服务器目录 | TrackMCP",
    description: "在 TrackMCP 浏览免费和开源 MCP 服务器，按类别、技术栈和仓库信息发现可供 AI Agent 使用的工具。",
    eyebrow: "MCP 服务器目录",
    heading: "发现免费和开源的 MCP 服务器",
    intro: "TrackMCP 目录帮助开发者从公开仓库中发现 MCP 服务器。请把目录记录当作发现入口，并在生产使用前阅读项目 README、许可证、权限和数据处理说明。",
    sections: [
      { heading: "目录记录包含什么", body: "目录可以提供仓库名称、GitHub 地址、语言、主题、类别、更新时间和相关说明。不同项目的数据完整度不同，使用前应回到项目维护者提供的原始文档。" },
      { heading: "生产采用前的检查清单", body: "确认维护状态、许可证、安装方式、认证范围、网络访问、数据处理、工具副作用和安全更新策略。不要仅凭星标数量判断可靠性。", bullets: ["读取官方 README 和变更记录", "确认所需权限和秘密的范围", "在隔离环境中运行健康检查", "为生产调用设置日志、超时和回滚"] },
      { heading: "从发现走向运营", body: "目录解决发现问题，TrackMCP 的服务器和工具分析解决运行后的证据问题。把选中的服务器接入后，观察真实客户端、工具调用、错误和延迟。" },
    ],
    related: [
      { label: "浏览完整目录", href: "/repository" },
      { label: "MCP 服务器分析", href: chinesePath("/mcp-server-analytics") },
      { label: "运行 MCP 健康检查", href: "/tools/mcp-health-check" },
    ],
  },
  "/docs": {
    path: "/docs",
    title: "TrackMCP 中文文档：MCP 服务器分析与 SDK",
    description: "阅读 TrackMCP 的中文文档，了解 MCP 服务器分析、TypeScript 和 Python SDK、认证、OpenTelemetry 与协议边界。",
    eyebrow: "中文文档",
    heading: "从服务器接入到可验证的运行信号",
    intro: "这套中文文档解释 TrackMCP 记录什么、如何接入、如何保护敏感数据，以及如何理解 MCP 协议层与应用层之间的边界。",
    sections: [
      { heading: "推荐阅读路径", body: "先阅读服务器分析概念，再选择 SDK 快速开始。若需要理解认证、遥测或协议细节，可以继续阅读对应的专项文档。", bullets: ["服务器分析概览", "TypeScript SDK", "Python SDK", "认证与 API", "OpenTelemetry", "MCP 协议"] },
      { heading: "数据边界先于仪表盘", body: "在接入之前决定哪些字段可以离开服务器进程。参数、结果、提示词和租户标识应该遵循你的隐私和保留策略；不可见或未授权的数据不能被分析页面推断。" },
      { heading: "遇到空数据时", body: "空状态不等于零使用。先检查 API key、SDK 初始化、事件时间范围、网络出口和工作流是否发出了显式终态。文档会把配置错误、没有事件和数据不足区分开。" },
    ],
    related: [
      { label: "协议文档", href: chinesePath("/docs/protocol") },
      { label: "TypeScript SDK", href: chinesePath("/docs/typescript") },
      { label: "Python SDK", href: chinesePath("/docs/python") },
    ],
  },
  "/docs/protocol": {
    path: "/docs/protocol",
    title: "MCP 协议与可观测性边界 | TrackMCP 中文文档",
    description: "理解 MCP 的客户端、服务器、工具、资源、会话和结果状态，以及如何在不混淆协议与应用语义的情况下进行观测。",
    eyebrow: "MCP 协议",
    heading: "把协议事件和应用结果分开理解",
    intro: "MCP 是连接模型驱动客户端与工具服务器的协议。要构建可靠分析，需要知道协议声明了什么、服务器观察到了什么，以及应用最终承诺了什么。",
    sections: [
      { heading: "客户端、服务器和能力", body: "客户端发起连接和请求，服务器暴露工具、资源或提示能力。初始化协商、能力声明和工具列表是重要的发现信号，但它们不代表某个工具已经产生了有效业务结果。" },
      { heading: "工具结果的状态", body: "一次调用可能在传输层成功，但工具结果仍然包含应用错误。观察系统应该保留协议结果、异常、超时、取消和重试的来源，而不是把所有信号压缩成 HTTP 状态。" },
      { heading: "完成需要明确证据", body: "一次工具调用或服务器响应不能自动证明用户任务完成。若要衡量工作流结果，请让应用发送明确、可审计的终态，并记录它与相关调用之间的关联。" },
    ],
    related: [
      { label: "服务器分析", href: chinesePath("/mcp-server-analytics") },
      { label: "OpenTelemetry", href: "/docs/opentelemetry" },
      { label: "认证文档", href: "/docs/authentication" },
    ],
  },
  "/docs/typescript": {
    path: "/docs/typescript",
    title: "TypeScript MCP 服务器接入 TrackMCP | 中文文档",
    description: "使用 TypeScript SDK 将 MCP 服务器的连接、工具调用、错误和延迟信号发送到 TrackMCP，保持异步、脱敏和 fail-open。",
    eyebrow: "TypeScript SDK",
    heading: "在 TypeScript 服务器边界接入分析",
    intro: "将 TrackMCP 包装在现有 TypeScript MCP 服务器周围，在本地过滤敏感字段，并异步发送运行信号。服务端遥测不可用时，服务器继续提供服务。",
    sections: [
      { heading: "接入前的准备", body: "创建 workspace 和 API key，明确服务名称、环境、数据保留和脱敏策略。不要把 API key 写入代码仓库或客户端响应。" },
      { heading: "记录哪些信号", body: "优先记录客户端、传输、协议版本、工具名称、结果状态、持续时间、错误分类、重试和取消。提示词、参数和结果应默认为敏感数据，除非经过明确政策批准。" },
      { heading: "验证接入", body: "先在测试环境运行一个真实工具调用，再检查事件是否到达。没有事件时，分别排查初始化、key、网络、时间范围和服务端是否真的收到了请求。" },
    ],
    related: [
      { label: "Python SDK", href: chinesePath("/docs/python") },
      { label: "认证", href: "/docs/authentication" },
      { label: "OpenTelemetry", href: "/docs/opentelemetry" },
    ],
  },
  "/docs/python": {
    path: "/docs/python",
    title: "Python MCP 服务器接入 TrackMCP | 中文文档",
    description: "使用 Python SDK 在 MCP 服务器边界采集客户端、工具、错误、延迟和明确工作流信号，并遵循本地脱敏与 fail-open 原则。",
    eyebrow: "Python SDK",
    heading: "在 Python 服务器边界采集可用信号",
    intro: "用最少的代码给现有 Python MCP 服务器添加异步分析。把隐私控制留在服务器进程内，把观测数据限制在实际运营问题所需要的范围。",
    sections: [
      { heading: "不要从结果反推秘密", body: "服务器可以记录结果状态、错误类别和耗时，但不要为了分析而上传完整提示词、工具参数或结果正文。必要时只发送经过哈希、截断或分类的字段。" },
      { heading: "区分服务器信号与工作流信号", body: "Python SDK 可以帮助记录服务器边界事件，但产品是否完成还需要应用显式发送工作流终态。这样可以避免把一次成功的工具响应误称为任务成功。" },
      { heading: "上线前检查", body: "在隔离环境验证 API key、网络访问、批量发送、超时和错误回退。遥测失败时要保持 MCP 服务本身可用，并在本地日志中保留可诊断的原因。" },
    ],
    related: [
      { label: "TypeScript SDK", href: chinesePath("/docs/typescript") },
      { label: "服务器分析", href: chinesePath("/mcp-server-analytics") },
      { label: "安全说明", href: "/security" },
    ],
  },
  "/blog": {
    path: "/blog",
    title: "MCP 工程与可观测性博客 | TrackMCP 中文",
    description: "阅读 TrackMCP 关于 MCP 服务器分析、可观测性、协议、工具使用和生产可靠性的中文研究与实用指南。",
    eyebrow: "中文博客",
    heading: "用证据理解 MCP 生产系统",
    intro: "这里整理关于 MCP 服务器、工具调用、协议边界、遥测和生产运维的中文内容。文章会明确证据来源、数据边界和 TrackMCP 能够或不能够观察到的内容。",
    sections: [
      { heading: "推荐主题", body: "从生产 MCP 可观测性开始，再阅读协议版本协商、工具结果错误、客户端使用路径和工作流结果。每个主题都应连接到官方协议文档、SDK 资料或可复现的工程方法。" },
      { heading: "如何使用这些文章", body: "把文章当作问题定义和排障入口，不要把示例数据或概念性解释当作你的生产事实。涉及安全、权限和数据处理时，回到你的服务器、供应商和组织策略。" },
      { heading: "继续阅读", body: "如果你正在部署 MCP 服务器，请先阅读服务器分析和 SDK 文档，再根据实际信号选择观察和告警方式。", bullets: ["MCP 可观测性", "MCP 服务器分析", "MCP 协议", "TypeScript 和 Python 接入"] },
    ],
    related: [
      { label: "MCP 可观测性", href: chinesePath("/mcp-observability") },
      { label: "中文文档", href: chinesePath("/docs") },
      { label: "英文博客归档", href: "/blog" },
    ],
  },
};

const icons = [Users, Wrench, Activity, Route];

export function generateStaticParams() {
  return Object.keys(pages).map((path) => ({ slug: path === "/" ? [] : path.slice(1).split("/") }));
}

export const dynamicParams = false;
export const revalidate = 3600;

function pageForSlug(slug: string[] | undefined): ChinesePage | null {
  const path = slug?.length ? `/${slug.join("/")}` : "/";
  return pages[path as ChineseSeoPath] || null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
  const page = pageForSlug((await params).slug);
  if (!page) return {};
  return chinesePageMeta(page);
}

export default async function ChineseSeoPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const page = pageForSlug((await params).slug);
  if (!page) return null;
  const url = `${SITE_URL}${chinesePath(page.path)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: page.title,
    description: page.description,
    inLanguage: "zh-CN",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
  };
  return (
    <div data-no-translate data-locale="zh-CN">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <Nav />
      <main className="flex-1"><PageFrame>
        <section className="border-b border-line bg-paper">
          <div className="mx-auto max-w-4xl px-6 pb-14 pt-16 sm:pb-20 sm:pt-24">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-brand">{page.eyebrow}</p>
            <h1 className="mt-4 max-w-3xl text-[38px] font-medium leading-[1.08] tracking-[-0.035em] text-ink sm:text-[56px]">{page.heading}</h1>
            <p className="mt-6 max-w-3xl text-[17px] leading-[1.75] text-muted sm:text-[19px]">{page.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={chinesePath("/mcp-server-analytics")} className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-[14px] font-medium text-white hover:bg-body">开始了解服务器分析 <ArrowRight size={15} /></Link>
              <Link href={chinesePath("/docs")} className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-white px-4 py-2.5 text-[14px] font-medium text-body hover:border-ink">阅读中文文档</Link>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
          <div className="grid gap-5 md:grid-cols-2">
            {page.sections.map((section, index) => {
              const Icon = icons[index % icons.length];
              return <article key={section.heading} className="rounded-2xl border border-line bg-white p-6 sm:p-8">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand-strong"><Icon size={18} /></div>
                <h2 className="mt-5 text-[22px] font-medium tracking-[-0.02em] text-ink">{section.heading}</h2>
                <p className="mt-3 text-[15px] leading-[1.75] text-muted">{section.body}</p>
                {section.bullets?.length ? <ul className="mt-5 space-y-2.5 text-[14px] leading-[1.6] text-body">{section.bullets.map((bullet) => <li key={bullet} className="flex gap-2.5"><Check size={16} className="mt-0.5 shrink-0 text-brand-strong" />{bullet}</li>)}</ul> : null}
              </article>;
            })}
          </div>
        </section>
        <section className="border-y border-line bg-mist">
          <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
            <h2 className="text-[24px] font-medium tracking-[-0.02em] text-ink">相关内容</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {page.related.map((item) => <Link key={item.href} href={item.href} className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3.5 text-[14px] font-medium text-body hover:border-ink"><span>{item.label}</span>{item.href.startsWith("http") ? <ExternalLink size={15} /> : <ArrowRight size={15} />}</Link>)}
            </div>
            <p className="mt-8 flex items-start gap-2 text-[13px] leading-[1.6] text-faint"><ShieldCheck size={15} className="mt-0.5 shrink-0" />TrackMCP 只描述可观察到的服务器边界信号，不会把未知数据或示例数据表述成生产事实。</p>
          </div>
        </section>
      </PageFrame></main>
      <Footer locale="zh-CN" />
    </div>
  );
}
