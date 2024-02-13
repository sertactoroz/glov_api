interface Env {}

const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 4;

const visitCounts = new Map<string, number>();
const streamSeqNumbers = new Map<string, number>();
const lastRequestTimes = new Map<string, number>();

async function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { searchParams } = new URL(request.url);

    // Check if "stream" parameter exists and its value
    const stream = searchParams.get("stream") === "true";

    // Check if Authorization header is present
    const authorizationHeader = request.headers.get("Authorization");
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer USER")) {
        return new Response("Unauthorized", { status: 401 });
    }

    const userIdMatch = authorizationHeader.match(/USER(\d{3})/);
    if (!userIdMatch) {
        return new Response("Unauthorized", { status: 401 });
    }
    const userId = userIdMatch[1];

    // Check rate limit
    const currentTime = Date.now();
    const lastRequestTime = lastRequestTimes.get(userId) || 0;
    const elapsedTime = currentTime - lastRequestTime;

    if (elapsedTime < RATE_LIMIT_WINDOW) {
        const visitCount = visitCounts.get(userId) || 0;
        if (visitCount >= RATE_LIMIT_MAX_REQUESTS) {
            return new Response("Rate Limit Exceeded", { status: 429 });
        }
    }

    // Update visit count
    visitCounts.set(userId, (visitCounts.get(userId) || 0) + 1);
    lastRequestTimes.set(userId, currentTime);

    // Update stream sequence number
    const streamSeq = streamSeqNumbers.get(userId) || 0;
    streamSeqNumbers.set(userId, streamSeq + 1);

    // Calculate group
    const group = hashStringToInt(userId) % 10 + 1;

    // Build response payload
    const responsePayload = {
        message: `Welcome USER_${userId}, this is your visit #${visitCounts.get(userId) || 1}`,
        group,
        rate_limit_left: RATE_LIMIT_MAX_REQUESTS - (visitCounts.get(userId) || 0),
        stream_seq: stream ? streamSeq : 0,
    };

    // Delay response if stream=true
    if (stream) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return new Response(JSON.stringify(responsePayload), {      headers: {
		"Content-Type": "application/json",
		"Access-Control-Allow-Origin": "*", 
		"Access-Control-Allow-Methods": "GET", 
		"Access-Control-Allow-Headers": "Authorization", 
	}, });
}

// Hash string to int for consistent grouping
function hashStringToInt(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash &= hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

export default {
    fetch: handleRequest,
};
