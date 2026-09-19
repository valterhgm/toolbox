type HealthResponse = {
  status: string;
};

async function getApiHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${process.env.API_BASE_URL}/api/v1/health`);
    if (!res.ok) return null;
    return (await res.json()) as HealthResponse;
  } catch {
    return null;
  }
}

export default async function Home() {
  const health = await getApiHealth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
        Toolbox
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Scala API status:{" "}
        <span
          className={
            health?.status === "ok"
              ? "font-mono text-green-600"
              : "font-mono text-red-600"
          }
        >
          {health?.status ?? "unreachable"}
        </span>
      </p>
    </div>
  );
}
