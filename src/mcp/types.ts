export type McpSuccessEnvelope<TData> = {
  ok: true;
  tool: string;
  data: TData;
};

export type McpErrorEnvelope = {
  ok: false;
  tool: string;
  error: {
    code: string;
    message: string;
  };
};

export type McpEnvelope<TData> = McpSuccessEnvelope<TData> | McpErrorEnvelope;
