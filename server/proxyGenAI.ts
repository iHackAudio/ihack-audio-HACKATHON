import { GoogleGenAI } from "@google/genai";

function convertSchemaTypes(schema: any): any {
    if (!schema) return schema;
    if (Array.isArray(schema)) return schema.map(convertSchemaTypes);
    if (typeof schema === 'object') {
        const result: any = {};
        for (const key in schema) {
            if (key === 'type' && typeof schema[key] === 'string') {
                result[key] = schema[key].toLowerCase();
            } else {
                result[key] = convertSchemaTypes(schema[key]);
            }
        }
        return result;
    }
    return schema;
}

export async function proxyGenerateContent(apiKey: string, model: string, request: any): Promise<any> {
    if (model.startsWith("groq/") || model.startsWith("mimo/") || model.startsWith("qwen/")) {
        let actualModel = model;
        if (model.startsWith("groq/")) actualModel = model.replace("groq/", "");
        if (model.startsWith("mimo/")) actualModel = model.replace("mimo/", "");
        if (model.startsWith("qwen/")) actualModel = model.replace("qwen/", "");

        const groqKey = process.env.GROQ_API_KEY || "";
        
        let systemInstruction = "";
        if (typeof request.config?.systemInstruction === "string") {
            systemInstruction = request.config.systemInstruction;
        } else if (request.config?.systemInstruction?.parts?.[0]?.text) {
            systemInstruction = request.config.systemInstruction.parts[0].text;
        }

        const messages = [];
        if (systemInstruction) {
            messages.push({ role: "system", content: systemInstruction });
        }

        for (const content of request.contents) {
            let role = content.role === "model" ? "assistant" : content.role;
            let textParts = [];
            let toolCalls = [];
            let toolCallId = "call_" + Math.random().toString(36).substring(7);
            
            for (const part of content.parts) {
                if (part.text) {
                    textParts.push(part.text);
                } else if (part.functionCall) {
                    toolCalls.push({
                        id: part.functionCall.id || toolCallId,
                        type: "function",
                        function: {
                            name: part.functionCall.name,
                            arguments: JSON.stringify(part.functionCall.args)
                        }
                    });
                } else if (part.functionResponse) {
                    role = "tool";
                    messages.push({
                        role: "tool",
                        tool_call_id: part.functionResponse.id || toolCallId,
                        name: part.functionResponse.name,
                        content: JSON.stringify(part.functionResponse.response)
                    });
                }
            }
            
            if (role !== "tool") {
                const msg: any = { role, content: textParts.join("\n") };
                if (toolCalls.length > 0) msg.tool_calls = toolCalls;
                messages.push(msg);
            }
        }

        let tools: any[] | undefined = undefined;
        if (request.config?.tools?.[0]?.functionDeclarations) {
            tools = request.config.tools[0].functionDeclarations.map((fn: any) => ({
                type: "function",
                function: {
                    name: fn.name,
                    description: fn.description,
                    parameters: convertSchemaTypes(fn.parameters)
                }
            }));
        }

        const payload: any = {
            model: actualModel,
            messages,
            temperature: request.config?.temperature ?? 0.5,
            max_tokens: 4096
        };
        if (tools && tools.length > 0) payload.tools = tools;

        let endpoint = "https://api.groq.com/openai/v1/chat/completions";
        let apiKeyToUse = groqKey;
        if (model.startsWith("mimo/")) {
            endpoint = "https://api.xiaomimimo.com/v1/chat/completions";
            apiKeyToUse = process.env.MIMO_API_KEY || groqKey;
        }

        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKeyToUse}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`API error (${endpoint}): ${res.status} ${errBody}`);
        }

        const data = await res.json() as any;
        const choice = data.choices[0];
        
        const responseObj: any = {
            text: choice.message.content || "",
            candidates: [{
                content: {
                    role: "model",
                    parts: []
                }
            }]
        };

        if (choice.message.content) {
            responseObj.candidates[0].content.parts.push({ text: choice.message.content });
        }

        if (choice.message.tool_calls) {
            responseObj.functionCalls = choice.message.tool_calls.map((tc: any) => ({
                id: tc.id,
                name: tc.function.name,
                args: JSON.parse(tc.function.arguments)
            }));
            
            responseObj.candidates[0].content.parts.push(...choice.message.tool_calls.map((tc: any) => ({
                functionCall: {
                    id: tc.id,
                    name: tc.function.name,
                    args: JSON.parse(tc.function.arguments)
                }
            })));
        }

        return responseObj;
    } else {
        const ai = new GoogleGenAI({ apiKey });
        const res = await ai.models.generateContent({ model, ...request });
        return res;
    }
}
