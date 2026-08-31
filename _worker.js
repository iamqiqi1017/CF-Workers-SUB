// 部署完成后在网址后面加上这个，获取自建节点和机场聚合节点，/?token=auto或/auto或

let mytoken = "auto";
let FileName = "CF-Workers-SUB";
let SUBUpdateTime = 6; //自定义订阅更新时间，单位小时
let total = 99; //TB
let timestamp = 4102329600000; //2099-12-31

//节点链接 + 订阅链接
let MainData = "";

let subConverter = "subapi.iamqiqi.in"; //在线订阅转换后端，目前使用CM的订阅转换功能。支持自建psub 可自行搭建https://github.com/bulianglin/psub
let subConfig =
  "https://raw.githubusercontent.com/iamqiqi1017/myClashRule/main/Clash-Full.ini"; //订阅配置文件
// let subConfig = "https://gcore.jsdelivr.net/gh/iamqiqi1017/myClashRule@main/Clash-Full.ini"; //订阅配置文件
let subProtocol = "https";
const SUBSCRIPTION_FETCH_USER_AGENT = "v2rayN/6.45";

export default {
  async fetch(request, env) {
    const userAgentHeader = request.headers.get("User-Agent");
    const userAgent = userAgentHeader ? userAgentHeader.toLowerCase() : "null";
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    mytoken = env.TOKEN || mytoken;
    subConverter = env.SUBAPI || subConverter;
    if (subConverter.includes("http://")) {
      subConverter = subConverter.split("//")[1];
      subProtocol = "http";
    } else {
      subConverter = subConverter.split("//")[1] || subConverter;
    }
    subConfig = env.SUBCONFIG || subConfig;
    FileName = env.SUBNAME || FileName;

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const timeTemp = Math.ceil(currentDate.getTime() / 1000);
    const fakeToken = await MD5MD5(`${mytoken}${timeTemp}`);
    //console.log(`${fakeUserID}\n${fakeHostName}`); // 打印fakeID

    let UD = Math.floor(
      (((timestamp - Date.now()) / timestamp) * total * 1099511627776) / 2,
    );
    total = total * 1099511627776;
    let expire = Math.floor(timestamp / 1000);
    SUBUpdateTime = env.SUBUPTIME || SUBUpdateTime;

    if (
      !(
        [mytoken, fakeToken].includes(token) ||
        url.pathname == "/" + mytoken ||
        url.pathname.includes("/" + mytoken + "?")
      )
    ) {
      if (env.URL302) return Response.redirect(env.URL302, 302);
      else if (env.URL) return await proxyURL(env.URL, url);
      else
        return new Response(await nginx(), {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=UTF-8",
          },
        });
    } else {
      let mainData = "";
      if (env.KV) {
        await 迁移地址列表(env, "LINK.txt");
        if (userAgent.includes("mozilla") && !url.search) {
          return await KV(request, env, "LINK.txt");
        } else {
          mainData = (await env.KV.get("LINK.txt")) || "";
        }
      } else {
        mainData = env.LINK || MainData;
      }
      const envUrls = env.KV ? [] : env.LINKSUB ? await ADD(env.LINKSUB) : [];
      let 重新汇总所有链接 = await ADD(mainData + "\n" + envUrls.join("\n"));
      let 自建节点 = "";
      let 订阅链接 = "";
      for (let x of 重新汇总所有链接) {
        if (x.toLowerCase().startsWith("http")) {
          订阅链接 += x + "\n";
        } else {
          自建节点 += x + "\n";
        }
      }
      const urls = await ADD(订阅链接);
      const isSubConverterRequest =
        request.headers.get("subconverter-request") ||
        request.headers.get("subconverter-version") ||
        userAgent.includes("subconverter");
      let 订阅格式 = "clash";
      if (
        token == fakeToken ||
        url.searchParams.has("b64") ||
        url.searchParams.has("base64")
      ) {
        订阅格式 = "base64";
      } else if (
        url.searchParams.has("sb") ||
        url.searchParams.has("singbox")
      ) {
        订阅格式 = "singbox";
      } else if (url.searchParams.has("surge")) {
        订阅格式 = "surge";
      } else if (url.searchParams.has("quanx")) {
        订阅格式 = "quanx";
      } else if (url.searchParams.has("loon")) {
        订阅格式 = "loon";
      } else if (url.searchParams.has("clash")) {
        订阅格式 = "clash";
      }

      let subConverterUrl;
      const 临时订阅URL = `${url.origin}/${await MD5MD5(fakeToken)}?token=${fakeToken}`;
      let 外部订阅转换URL = "";
      let 订阅转换URL = "";
      //console.log(订阅转换URL);
      let req_data = 自建节点;
      const 仅返回临时自建节点 = token == fakeToken;

      const 订阅链接数组 = [...new Set(urls)].filter((item) => item?.trim?.()); // 去重
      if (订阅链接数组.length > 0 && !仅返回临时自建节点) {
        if (订阅格式 != "base64") {
          外部订阅转换URL = 订阅链接数组.join("|");
        } else {
          const 请求订阅响应内容 = await getSUB(
            订阅链接数组,
            request,
            订阅格式,
          );
          console.log(请求订阅响应内容);
          req_data += 请求订阅响应内容[0].join("\n");
          外部订阅转换URL = 请求订阅响应内容[1];
          if (!isSubConverterRequest && 请求订阅响应内容[1].includes("://")) {
            subConverterUrl = `${subProtocol}://${subConverter}/sub?target=mixed&url=${encodeURIComponent(请求订阅响应内容[1])}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
            try {
              const subConverterResponse = await fetch(subConverterUrl, {
                headers: {
                  "User-Agent":
                    "v2rayN/CF-Workers-SUB  (https://github.com/cmliu/CF-Workers-SUB)",
                },
              });
              if (subConverterResponse.ok) {
                const subConverterContent = await subConverterResponse.text();
                req_data += "\n" + atob(subConverterContent);
              }
            } catch (error) {
              console.log(
                "订阅转换请回base64失败，检查订阅转换后端是否正常运行",
              );
            }
          }
        }
      }

      //修复中文错误
      const utf8Encoder = new TextEncoder();
      const encodedData = utf8Encoder.encode(req_data);
      //const text = String.fromCharCode.apply(null, encodedData);
      const utf8Decoder = new TextDecoder();
      const text = utf8Decoder.decode(encodedData);

      //去重
      const uniqueLines = new Set(text.split("\n"));
      const result = [...uniqueLines].join("\n");
      //console.log(result);

      const 订阅转换URL列表 = [];
      if (result.trim()) 订阅转换URL列表.push(临时订阅URL);
      if (外部订阅转换URL)
        订阅转换URL列表.push(...外部订阅转换URL.split("|").filter(Boolean));
      if (env.WARP)
        订阅转换URL列表.push(...(await ADD(env.WARP)).filter(Boolean));
      订阅转换URL = 订阅转换URL列表.join("|");

      let base64Data;
      try {
        base64Data = btoa(result);
      } catch (e) {
        function encodeBase64(data) {
          const binary = new TextEncoder().encode(data);
          let base64 = "";
          const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

          for (let i = 0; i < binary.length; i += 3) {
            const byte1 = binary[i];
            const byte2 = binary[i + 1] || 0;
            const byte3 = binary[i + 2] || 0;

            base64 += chars[byte1 >> 2];
            base64 += chars[((byte1 & 3) << 4) | (byte2 >> 4)];
            base64 += chars[((byte2 & 15) << 2) | (byte3 >> 6)];
            base64 += chars[byte3 & 63];
          }

          const padding = 3 - (binary.length % 3 || 3);
          return (
            base64.slice(0, base64.length - padding) + "==".slice(0, padding)
          );
        }

        base64Data = encodeBase64(result);
      }

      // 构建响应头对象
      const responseHeaders = {
        "content-type": "text/plain; charset=utf-8",
        "Profile-Update-Interval": `${SUBUpdateTime}`,
        "Profile-web-page-url": request.url.includes("?")
          ? request.url.split("?")[0]
          : request.url,
        //"Subscription-Userinfo": `upload=${UD}; download=${UD}; total=${total}; expire=${expire}`,
      };

      if (订阅格式 == "base64" || token == fakeToken) {
        return new Response(base64Data, { headers: responseHeaders });
      } else if (订阅格式 == "clash") {
        subConverterUrl = `${subProtocol}://${subConverter}/sub?target=clash&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
      } else if (订阅格式 == "singbox") {
        subConverterUrl = `${subProtocol}://${subConverter}/sub?target=singbox&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
      } else if (订阅格式 == "surge") {
        subConverterUrl = `${subProtocol}://${subConverter}/sub?target=surge&ver=4&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
      } else if (订阅格式 == "quanx") {
        subConverterUrl = `${subProtocol}://${subConverter}/sub?target=quanx&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&udp=true`;
      } else if (订阅格式 == "loon") {
        subConverterUrl = `${subProtocol}://${subConverter}/sub?target=loon&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false`;
      }
      //console.log(订阅转换URL);
      try {
        const subConverterResponse = await fetch(subConverterUrl, {
          headers: { "User-Agent": userAgentHeader },
        }); //订阅转换
        if (!subConverterResponse.ok)
          return new Response(base64Data, { headers: responseHeaders });
        let subConverterContent = await subConverterResponse.text();
        if (订阅格式 == "clash")
          subConverterContent = await clashFix(subConverterContent);
        // 只有非浏览器订阅才会返回SUBNAME
        if (!userAgent.includes("mozilla"))
          responseHeaders["Content-Disposition"] =
            `attachment; filename*=utf-8''${encodeURIComponent(FileName)}`;
        return new Response(subConverterContent, { headers: responseHeaders });
      } catch (error) {
        return new Response(base64Data, { headers: responseHeaders });
      }
    }
  },
};

async function ADD(envadd) {
  var addtext = envadd.replace(/[	"'|\r\n]+/g, "\n").replace(/\n+/g, "\n"); // 替换为换行
  //console.log(addtext);
  if (addtext.charAt(0) == "\n") addtext = addtext.slice(1);
  if (addtext.charAt(addtext.length - 1) == "\n")
    addtext = addtext.slice(0, addtext.length - 1);
  const add = addtext.split("\n");
  //console.log(add);
  return add;
}

async function nginx() {
  const text = `
	<!DOCTYPE html>
	<html>
	<head>
	<title>Welcome to nginx!</title>
	<style>
		:root {
			--bg-color: #f8f9fa;
			--text-color: #212529;
			--accent-color: #009639;
			--card-bg: #ffffff;
			--border-color: #e9ecef;
		}
		@media (prefers-color-scheme: dark) {
			:root {
				--bg-color: #1a1a2e;
				--text-color: #e0e0e0;
				--accent-color: #00c853;
				--card-bg: #16213e;
				--border-color: #2a2a4a;
			}
		}
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			background: var(--bg-color);
			color: var(--text-color);
			min-height: 100vh;
			display: flex;
			justify-content: center;
			align-items: center;
			padding: 2rem;
		}
		.container {
			background: var(--card-bg);
			border-radius: 12px;
			padding: 2.5rem;
			max-width: 600px;
			width: 100%;
			box-shadow: 0 4px 24px rgba(0,0,0,0.08);
			border: 1px solid var(--border-color);
		}
		.logo {
			display: flex;
			align-items: center;
			gap: 12px;
			margin-bottom: 1.5rem;
			padding-bottom: 1.5rem;
			border-bottom: 2px solid var(--accent-color);
		}
		.logo-icon {
			width: 48px;
			height: 48px;
			background: var(--accent-color);
			border-radius: 8px;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 24px;
			color: white;
			font-weight: bold;
		}
		h1 {
			font-size: 1.5rem;
			font-weight: 600;
			color: var(--text-color);
		}
		p {
			line-height: 1.6;
			margin-bottom: 1rem;
			color: var(--text-color);
			opacity: 0.85;
		}
		.links {
			display: flex;
			gap: 1rem;
			margin-top: 1.5rem;
			padding-top: 1.5rem;
			border-top: 1px solid var(--border-color);
		}
		a {
			color: var(--accent-color);
			text-decoration: none;
			font-weight: 500;
			padding: 0.5rem 1rem;
			border-radius: 6px;
			background: rgba(0, 150, 57, 0.08);
			transition: all 0.2s ease;
		}
		a:hover {
			background: rgba(0, 150, 57, 0.15);
			transform: translateY(-1px);
		}
		.footer {
			margin-top: 2rem;
			font-size: 0.875rem;
			opacity: 0.6;
		}
	</style>
	</head>
	<body>
	<div class="container">
		<div class="logo">
			<div class="logo-icon">n</div>
			<h1>Welcome to nginx!</h1>
		</div>
		<p>If you see this page, the nginx web server is successfully installed and working. Further configuration is required.</p>
		<div class="links">
			<a href="http://nginx.org/">Documentation</a>
			<a href="http://nginx.com/">Commercial Support</a>
		</div>
		<p class="footer"><em>Thank you for using nginx.</em></p>
	</div>
	</body>
	</html>
	`;
  return text;
}

function base64Decode(str) {
  const bytes = new Uint8Array(
    atob(str)
      .split("")
      .map((c) => c.charCodeAt(0)),
  );
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(bytes);
}

async function MD5MD5(text) {
  const encoder = new TextEncoder();

  const firstPass = await crypto.subtle.digest("MD5", encoder.encode(text));
  const firstPassArray = Array.from(new Uint8Array(firstPass));
  const firstHex = firstPassArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const secondPass = await crypto.subtle.digest(
    "MD5",
    encoder.encode(firstHex.slice(7, 27)),
  );
  const secondPassArray = Array.from(new Uint8Array(secondPass));
  const secondHex = secondPassArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return secondHex.toLowerCase();
}

function clashFix(content) {
  if (
    content.includes("wireguard") &&
    !content.includes("remote-dns-resolve")
  ) {
    let lines;
    if (content.includes("\r\n")) {
      lines = content.split("\r\n");
    } else {
      lines = content.split("\n");
    }

    let result = "";
    for (let line of lines) {
      if (line.includes("type: wireguard")) {
        const 备改内容 = `, mtu: 1280, udp: true`;
        const 正确内容 = `, mtu: 1280, remote-dns-resolve: true, udp: true`;
        result += line.replace(new RegExp(备改内容, "g"), 正确内容) + "\n";
      } else {
        result += line + "\n";
      }
    }

    content = result;
  }
  return content;
}

async function proxyURL(proxyURL, url) {
  const URLs = await ADD(proxyURL);
  const fullURL = URLs[Math.floor(Math.random() * URLs.length)];

  // 解析目标 URL
  let parsedURL = new URL(fullURL);
  console.log(parsedURL);
  // 提取并可能修改 URL 组件
  let URLProtocol = parsedURL.protocol.slice(0, -1) || "https";
  let URLHostname = parsedURL.hostname;
  let URLPathname = parsedURL.pathname;
  let URLSearch = parsedURL.search;

  // 处理 pathname
  if (URLPathname.charAt(URLPathname.length - 1) == "/") {
    URLPathname = URLPathname.slice(0, -1);
  }
  URLPathname += url.pathname;

  // 构建新的 URL
  let newURL = `${URLProtocol}://${URLHostname}${URLPathname}${URLSearch}`;

  // 反向代理请求
  let response = await fetch(newURL);

  // 创建新的响应
  let newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });

  // 添加自定义头部，包含 URL 信息
  //newResponse.headers.set('X-Proxied-By', 'Cloudflare Worker');
  //newResponse.headers.set('X-Original-URL', fullURL);
  newResponse.headers.set("X-New-URL", newURL);

  return newResponse;
}

async function getSUB(api, request, 订阅格式) {
  if (!api || api.length === 0) {
    return [];
  } else api = [...new Set(api)]; // 去重
  let newapi = "";
  const 订阅转换URLs = [];
  let 异常订阅 = "";
  const controller = new AbortController(); // 创建一个AbortController实例，用于取消请求
  const timeout = setTimeout(() => {
    controller.abort(); // 2秒后取消所有请求
  }, 2000);

  try {
    // 使用Promise.allSettled等待所有API请求完成，无论成功或失败
    const responses = await Promise.allSettled(
      api.map((apiUrl) =>
        getUrl(request, apiUrl, 订阅格式, controller.signal).then((response) =>
          response.ok ? response.text() : Promise.reject(response),
        ),
      ),
    );

    // 遍历所有响应
    const modifiedResponses = responses.map((response, index) => {
      // 检查是否请求成功
      if (response.status === "rejected") {
        const reason = response.reason;
        if (reason && reason.name === "AbortError") {
          return {
            status: "超时",
            value: null,
            apiUrl: api[index], // 将原始的apiUrl添加到返回对象中
            passthrough: true,
          };
        }
        console.error(
          `请求失败: ${api[index]}, 错误信息: ${reason.status} ${reason.statusText}`,
        );
        return {
          status: "请求失败",
          value: null,
          apiUrl: api[index], // 将原始的apiUrl添加到返回对象中
          passthrough: true,
        };
      }
      return {
        status: response.status,
        value: response.value,
        apiUrl: api[index], // 将原始的apiUrl添加到返回对象中
      };
    });

    console.log(modifiedResponses); // 输出修改后的响应数组

    for (const response of modifiedResponses) {
      // 检查响应状态是否为'fulfilled'
      if (response.status === "fulfilled") {
        const content = (await response.value) || "null"; // 获取响应的内容
        if (content.includes("proxies:")) {
          //console.log('Clash订阅: ' + response.apiUrl);
          订阅转换URLs.push(response.apiUrl); // Clash 配置
        } else if (
          content.includes('outbounds"') &&
          content.includes('inbounds"')
        ) {
          //console.log('Singbox订阅: ' + response.apiUrl);
          订阅转换URLs.push(response.apiUrl); // Singbox 配置
        } else if (content.includes("://")) {
          //console.log('明文订阅: ' + response.apiUrl);
          newapi += content + "\n"; // 追加内容
        } else if (isValidBase64(content)) {
          //console.log('Base64订阅: ' + response.apiUrl);
          newapi += base64Decode(content) + "\n"; // 解码并追加内容
        } else {
          console.log(
            "无法识别订阅内容，交给订阅转换后端处理: " + response.apiUrl,
          );
          订阅转换URLs.push(response.apiUrl);
        }
      } else if (response.passthrough) {
        // Worker 预拉取失败时，保留原始订阅地址，让订阅转换后端继续尝试。
        订阅转换URLs.push(response.apiUrl);
      }
    }
  } catch (error) {
    console.error(error); // 捕获并输出错误信息
  } finally {
    clearTimeout(timeout); // 清除定时器
  }

  const 订阅内容 = await ADD(newapi + 异常订阅); // 将处理后的内容转换为数组
  // 返回处理后的结果
  return [订阅内容, 订阅转换URLs.join("|")];
}

async function getUrl(request, targetUrl, 订阅格式, signal) {
  const newHeaders = new Headers(request.headers);
  newHeaders.set("User-Agent", SUBSCRIPTION_FETCH_USER_AGENT);

  // 构建新的请求对象
  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: newHeaders,
    body: request.method === "GET" ? null : request.body,
    redirect: "follow",
    signal,
    cf: {
      // 忽略SSL证书验证
      insecureSkipVerify: true,
      // 允许自签名证书
      allowUntrusted: true,
      // 禁用证书验证
      validateCertificate: false,
    },
  });

  // 输出请求的详细信息
  console.log(`请求URL: ${targetUrl}`);
  console.log(`请求头: ${JSON.stringify([...newHeaders])}`);
  console.log(`请求方法: ${request.method}`);
  console.log(`请求体: ${request.method === "GET" ? null : request.body}`);

  // 发送请求并返回响应
  return fetch(modifiedRequest);
}

function isValidBase64(str) {
  // 先移除所有空白字符(空格、换行、回车等)
  const cleanStr = str.replace(/\s/g, "");
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  return base64Regex.test(cleanStr);
}

async function 迁移地址列表(env, txt = "ADD.txt") {
  const 旧数据 = await env.KV.get(`/${txt}`);
  const 新数据 = await env.KV.get(txt);

  if (旧数据 && !新数据) {
    // 写入新位置
    await env.KV.put(txt, 旧数据);
    // 删除旧数据
    await env.KV.delete(`/${txt}`);
    return true;
  }
  return false;
}

async function KV(request, env, txt = "ADD.txt") {
  const url = new URL(request.url);
  try {
    // POST请求处理
    if (request.method === "POST") {
      if (!env.KV) return new Response("未绑定KV空间", { status: 400 });
      try {
        const content = await request.text();
        await env.KV.put(txt, content);
        return new Response("保存成功");
      } catch (error) {
        console.error("保存KV时发生错误:", error);
        return new Response("保存失败: " + error.message, { status: 500 });
      }
    }

    // GET请求部分
    let content = "";
    let hasKV = !!env.KV;

    if (hasKV) {
      try {
        content = (await env.KV.get(txt)) || "";
      } catch (error) {
        console.error("读取KV时发生错误:", error);
        content = "读取数据时发生错误: " + error.message;
      }
    }

    const html = `
			<!DOCTYPE html>
			<html lang="zh-CN">
				<head>
					<title>${FileName} 订阅编辑</title>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1">
					<style>
						:root {
							--primary: #6366f1;
							--primary-hover: #4f46e5;
							--primary-light: rgba(99, 102, 241, 0.1);
							--success: #22c55e;
							--success-hover: #16a34a;
							--bg: #f8fafc;
							--card-bg: #ffffff;
							--text: #1e293b;
							--text-secondary: #64748b;
							--border: #e2e8f0;
							--input-bg: #ffffff;
							--shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
							--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.05);
							--radius: 10px;
							--radius-lg: 16px;
						}
						@media (prefers-color-scheme: dark) {
							:root {
								--primary: #818cf8;
								--primary-hover: #6366f1;
								--primary-light: rgba(129, 140, 248, 0.15);
								--bg: #0f172a;
								--card-bg: #1e293b;
								--text: #f1f5f9;
								--text-secondary: #94a3b8;
								--border: #334155;
								--input-bg: #0f172a;
								--shadow: 0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.15);
								--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.3), 0 4px 6px -4px rgba(0,0,0,0.2);
							}
						}
						* {
							margin: 0;
							padding: 0;
							box-sizing: border-box;
						}
						body {
							font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
							background: var(--bg);
							color: var(--text);
							line-height: 1.6;
							padding: 1rem;
						}
						.container {
							max-width: 800px;
							margin: 0 auto;
						}
						.header {
							background: var(--card-bg);
							border-radius: var(--radius-lg);
							padding: 2rem;
							margin-bottom: 1rem;
							box-shadow: var(--shadow);
							border: 1px solid var(--border);
						}
						.header h1 {
							font-size: 1.5rem;
							font-weight: 700;
							margin-bottom: 0.5rem;
							background: linear-gradient(135deg, var(--primary), #a855f7);
							-webkit-background-clip: text;
							-webkit-text-fill-color: transparent;
							background-clip: text;
						}
						.header p {
							color: var(--text-secondary);
							font-size: 0.9rem;
						}
						.card {
							background: var(--card-bg);
							border-radius: var(--radius-lg);
							padding: 1.5rem;
							margin-bottom: 1rem;
							box-shadow: var(--shadow);
							border: 1px solid var(--border);
						}
						.card-title {
							font-size: 1rem;
							font-weight: 600;
							margin-bottom: 1rem;
							display: flex;
							align-items: center;
							gap: 0.5rem;
						}
						.card-title::before {
							content: '';
							width: 4px;
							height: 18px;
							background: var(--primary);
							border-radius: 2px;
						}
						.sub-item {
							display: flex;
							align-items: center;
							justify-content: space-between;
							padding: 0.75rem 1rem;
							background: var(--input-bg);
							border: 1px solid var(--border);
							border-radius: var(--radius);
							margin-bottom: 0.5rem;
							transition: all 0.2s ease;
						}
						.sub-item:hover {
							border-color: var(--primary);
							box-shadow: 0 0 0 3px var(--primary-light);
						}
						.sub-label {
							font-weight: 500;
							font-size: 0.875rem;
							color: var(--text-secondary);
							min-width: 80px;
						}
						.sub-link {
							color: var(--primary);
							text-decoration: none;
							font-size: 0.875rem;
							word-break: break-all;
							flex: 1;
							margin: 0 0.75rem;
							cursor: pointer;
							padding: 0.25rem 0.5rem;
							border-radius: 4px;
							transition: background 0.2s ease;
						}
						.sub-link:hover {
							background: var(--primary-light);
						}
						.sub-btn {
							padding: 0.375rem 0.75rem;
							background: var(--primary);
							color: white;
							border: none;
							border-radius: 6px;
							font-size: 0.75rem;
							font-weight: 500;
							cursor: pointer;
							white-space: nowrap;
							transition: all 0.2s ease;
						}
						.sub-btn:hover {
							background: var(--primary-hover);
							transform: translateY(-1px);
						}
						.qrcode-container {
							display: none;
							padding: 1rem;
							justify-content: center;
							background: white;
							border-radius: var(--radius);
							margin-top: 0.5rem;
						}
						.qrcode-container.show {
							display: flex;
						}
						.config-item {
							display: flex;
							padding: 0.625rem 0;
							border-bottom: 1px solid var(--border);
							font-size: 0.875rem;
						}
						.config-item:last-child {
							border-bottom: none;
						}
						.config-label {
							color: var(--text-secondary);
							min-width: 200px;
							font-weight: 500;
						}
						.config-value {
							color: var(--text);
							word-break: break-all;
						}
						.editor-container {
							margin-top: 0.5rem;
						}
						.editor {
							width: 100%;
							height: 280px;
							padding: 1rem;
							background: var(--input-bg);
							color: var(--text);
							border: 1px solid var(--border);
							border-radius: var(--radius);
							font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace;
							font-size: 0.8125rem;
							line-height: 1.6;
							resize: vertical;
							transition: border-color 0.2s ease, box-shadow 0.2s ease;
						}
						.editor:focus {
							outline: none;
							border-color: var(--primary);
							box-shadow: 0 0 0 3px var(--primary-light);
						}
						.editor::placeholder {
							color: var(--text-secondary);
							opacity: 0.6;
						}
						.save-container {
							display: flex;
							align-items: center;
							gap: 1rem;
							margin-top: 0.75rem;
						}
						.save-btn {
							padding: 0.625rem 1.5rem;
							background: var(--success);
							color: white;
							border: none;
							border-radius: var(--radius);
							font-size: 0.875rem;
							font-weight: 600;
							cursor: pointer;
							transition: all 0.2s ease;
						}
						.save-btn:hover {
							background: var(--success-hover);
							transform: translateY(-1px);
							box-shadow: var(--shadow);
						}
						.save-btn:disabled {
							opacity: 0.6;
							cursor: not-allowed;
							transform: none;
						}
						.save-status {
							font-size: 0.8125rem;
							color: var(--text-secondary);
						}
						.footer {
							text-align: center;
							padding: 1.5rem;
							color: var(--text-secondary);
							font-size: 0.8125rem;
						}
						.footer a {
							color: var(--primary);
							text-decoration: none;
						}
						.footer a:hover {
							text-decoration: underline;
						}
						.toast {
							position: fixed;
							top: 1.5rem;
							right: 1.5rem;
							padding: 0.875rem 1.25rem;
							background: var(--card-bg);
							border: 1px solid var(--border);
							border-radius: var(--radius);
							box-shadow: var(--shadow-lg);
							font-size: 0.875rem;
							z-index: 1000;
							transform: translateX(120%);
							transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
						}
						.toast.show {
							transform: translateX(0);
						}
						.toast.success {
							border-left: 4px solid var(--success);
						}
						@media (max-width: 640px) {
							body {
								padding: 0.5rem;
							}
							.header, .card {
								padding: 1.25rem;
							}
							.sub-item {
								flex-wrap: wrap;
								gap: 0.5rem;
							}
							.sub-link {
								margin: 0;
								order: 3;
								flex-basis: 100%;
							}
							.config-item {
								flex-direction: column;
								gap: 0.25rem;
							}
							.config-label {
								min-width: auto;
							}
						}
					</style>
					<script src="https://cdn.jsdelivr.net/npm/@keeex/qrcodejs-kx@1.0.2/qrcode.min.js"></script>
				</head>
				<body>
					<div class="container">
						<div class="header">
							<h1>${FileName}</h1>
							<p>订阅管理面板 - 点击链接复制订阅地址并生成二维码</p>
						</div>

						<div class="card">
							<div class="card-title">订阅地址</div>
							<div class="sub-item">
								<span class="sub-label">Base64</span>
								<a class="sub-link" onclick="copyAndShowQR('https://${url.hostname}/${mytoken}?b64', 'qr_0')">https://${url.hostname}/${mytoken}?b64</a>
								<button class="sub-btn" onclick="copyAndShowQR('https://${url.hostname}/${mytoken}?b64', 'qr_0')">复制</button>
							</div>
							<div class="qrcode-container" id="qr_0"></div>

							<div class="sub-item">
								<span class="sub-label">Clash</span>
								<a class="sub-link" onclick="copyAndShowQR('https://${url.hostname}/${mytoken}?clash', 'qr_1')">https://${url.hostname}/${mytoken}?clash</a>
								<button class="sub-btn" onclick="copyAndShowQR('https://${url.hostname}/${mytoken}?clash', 'qr_1')">复制</button>
							</div>
							<div class="qrcode-container" id="qr_1"></div>

							<div class="sub-item">
								<span class="sub-label">Singbox</span>
								<a class="sub-link" onclick="copyAndShowQR('https://${url.hostname}/${mytoken}?sb', 'qr_2')">https://${url.hostname}/${mytoken}?sb</a>
								<button class="sub-btn" onclick="copyAndShowQR('https://${url.hostname}/${mytoken}?sb', 'qr_2')">复制</button>
							</div>
							<div class="qrcode-container" id="qr_2"></div>

							<div class="sub-item">
								<span class="sub-label">Surge</span>
								<a class="sub-link" onclick="copyAndShowQR('https://${url.hostname}/${mytoken}?surge', 'qr_3')">https://${url.hostname}/${mytoken}?surge</a>
								<button class="sub-btn" onclick="copyAndShowQR('https://${url.hostname}/${mytoken}?surge', 'qr_3')">复制</button>
							</div>
							<div class="qrcode-container" id="qr_3"></div>

							<div class="sub-item">
								<span class="sub-label">Loon</span>
								<a class="sub-link" onclick="copyAndShowQR('https://${url.hostname}/${mytoken}?loon', 'qr_4')">https://${url.hostname}/${mytoken}?loon</a>
								<button class="sub-btn" onclick="copyAndShowQR('https://${url.hostname}/${mytoken}?loon', 'qr_4')">复制</button>
							</div>
							<div class="qrcode-container" id="qr_4"></div>
						</div>

						<div class="card">
							<div class="card-title">订阅转换配置</div>
							<div class="config-item">
								<span class="config-label">SUBAPI (转换后端)</span>
								<span class="config-value">${subProtocol}://${subConverter}</span>
							</div>
							<div class="config-item">
								<span class="config-label">SUBCONFIG (配置文件)</span>
								<span class="config-value">${subConfig}</span>
							</div>
						</div>

						<div class="card">
							<div class="card-title">${FileName} 汇聚订阅编辑</div>
							<div class="editor-container">
								${
                  hasKV
                    ? `
								<textarea class="editor"
									placeholder="LINK示例（一行一个节点或订阅链接）：
vless://uuid@example.com:443?encryption=none&amp;security=tls#自建节点
trojan://password@example.com:443?security=tls#HK
https://example.com/sub"
									id="content">${content}</textarea>
								<div class="save-container">
									<button class="save-btn" id="saveBtn" onclick="saveContent(this)">保存</button>
									<span class="save-status" id="saveStatus"></span>
								</div>
								`
                    : '<p style="color: var(--text-secondary);">请绑定 <strong>变量名称</strong> 为 <strong>KV</strong> 的KV命名空间</p>'
                }
							</div>
						</div>

						<div class="footer">
							UA: <strong>${request.headers.get("User-Agent")}</strong>
						</div>
					</div>
					<div class="toast" id="toast"></div>
					<script>
					// Toast notification
					function showToast(message, type = 'success') {
						const toast = document.getElementById('toast');
						toast.textContent = message;
						toast.className = 'toast ' + type;
						setTimeout(() => toast.classList.add('show'), 10);
						setTimeout(() => toast.classList.remove('show'), 2500);
					}

					// Copy and show QR code
					function copyAndShowQR(text, qrId) {
						navigator.clipboard.writeText(text).then(() => {
							showToast('已复制到剪贴板');
						}).catch(err => {
							console.error('复制失败:', err);
							showToast('复制失败，请手动复制', 'error');
						});

						const qrContainer = document.getElementById(qrId);
						const isShow = qrContainer.classList.contains('show');

						// Hide all QR codes
						document.querySelectorAll('.qrcode-container').forEach(el => {
							el.classList.remove('show');
							el.innerHTML = '';
						});

						// Toggle current QR code
						if (!isShow) {
							qrContainer.classList.add('show');
							new QRCode(qrContainer, {
								text: text,
								width: 180,
								height: 180,
								colorDark: "#1e293b",
								colorLight: "#ffffff",
								correctLevel: QRCode.CorrectLevel.Q
							});
						}
					}

					if (document.querySelector('.editor')) {
						let timer;
						const textarea = document.getElementById('content');
						const originalContent = textarea.value;

						function replaceFullwidthColon() {
							const text = textarea.value;
							textarea.value = text.replace(/：/g, ':');
						}

						function saveContent(button) {
							try {
								const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
								if (!isIOS) {
									replaceFullwidthColon();
								}

								button.disabled = true;
								button.textContent = '保存中...';

								const textarea = document.getElementById('content');
								if (!textarea) {
									throw new Error('找不到文本编辑区域');
								}

								let newContent = textarea.value || '';
								let originalContent = textarea.defaultValue || '';

								const updateStatus = (message, isError = false) => {
									const statusElem = document.getElementById('saveStatus');
									if (statusElem) {
										statusElem.textContent = message;
										statusElem.style.color = isError ? '#ef4444' : 'var(--text-secondary)';
									}
								};

								const resetButton = () => {
									button.textContent = '保存';
									button.disabled = false;
								};

								if (newContent !== originalContent) {
									fetch(window.location.href, {
										method: 'POST',
										body: newContent,
										headers: {
											'Content-Type': 'text/plain;charset=UTF-8'
										},
										cache: 'no-cache'
									})
									.then(response => {
										if (!response.ok) {
											throw new Error(\`HTTP error! status: \${response.status}\`);
										}
										const now = new Date().toLocaleString();
										document.title = \`编辑已保存 \${now}\`;
										updateStatus(\`已保存 \${now}\`);
										showToast('保存成功');
									})
									.catch(error => {
										console.error('Save error:', error);
										updateStatus(\`保存失败: \${error.message}\`, true);
										showToast('保存失败: ' + error.message, 'error');
									})
									.finally(() => {
										resetButton();
									});
								} else {
									updateStatus('内容未变化');
									resetButton();
								}
							} catch (error) {
								console.error('保存过程出错:', error);
								button.textContent = '保存';
								button.disabled = false;
								const statusElem = document.getElementById('saveStatus');
								if (statusElem) {
									statusElem.textContent = \`错误: \${error.message}\`;
									statusElem.style.color = '#ef4444';
								}
							}
						}

						textarea.addEventListener('blur', () => saveContent(document.getElementById('saveBtn')));
						textarea.addEventListener('input', () => {
							clearTimeout(timer);
							timer = setTimeout(() => saveContent(document.getElementById('saveBtn')), 5000);
						});
					}
					</script>
				</body>
			</html>
		`;

    return new Response(html, {
      headers: { "Content-Type": "text/html;charset=utf-8" },
    });
  } catch (error) {
    console.error("处理请求时发生错误:", error);
    return new Response("服务器错误: " + error.message, {
      status: 500,
      headers: { "Content-Type": "text/plain;charset=utf-8" },
    });
  }
}
