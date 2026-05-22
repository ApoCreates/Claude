--!nonstrict
-- Roblox VFX Forge — Studio plugin
-- Paste a JSON config exported from the web app, select a Part/Attachment in
-- the workspace, and click "Apply" to build the ParticleEmitter on it.
--
-- Install: save this file via "Save as Local Plugin" in Studio, or sync the
-- /plugin folder with Rojo. See README for details.

local Selection = game:GetService("Selection")
local HttpService = game:GetService("HttpService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")

local toolbar = plugin:CreateToolbar("VFX Forge")
local button = toolbar:CreateButton(
	"VFX Forge",
	"Apply a particle config to the selected object",
	"rbxasset://textures/particles/sparkles_main.dds"
)
button.ClickableWhenViewportHidden = true

local widget = plugin:CreateDockWidgetPluginGui(
	"VFXForge_Main",
	DockWidgetPluginGuiInfo.new(Enum.InitialDockState.Right, false, false, 360, 460, 300, 360)
)
widget.Title = "VFX Forge"

-- ---------- UI ----------
local root = Instance.new("Frame")
root.Size = UDim2.fromScale(1, 1)
root.BackgroundColor3 = Color3.fromRGB(20, 24, 31)
root.BorderSizePixel = 0
root.Parent = widget

local pad = Instance.new("UIPadding")
pad.PaddingTop = UDim.new(0, 10)
pad.PaddingBottom = UDim.new(0, 10)
pad.PaddingLeft = UDim.new(0, 10)
pad.PaddingRight = UDim.new(0, 10)
pad.Parent = root

local layout = Instance.new("UIListLayout")
layout.Padding = UDim.new(0, 8)
layout.SortOrder = Enum.SortOrder.LayoutOrder
layout.Parent = root

local function label(text, order, size)
	local l = Instance.new("TextLabel")
	l.Size = UDim2.new(1, 0, 0, size or 18)
	l.BackgroundTransparency = 1
	l.TextColor3 = Color3.fromRGB(200, 210, 224)
	l.TextXAlignment = Enum.TextXAlignment.Left
	l.Font = Enum.Font.Gotham
	l.TextSize = 13
	l.Text = text
	l.LayoutOrder = order
	l.Parent = root
	return l
end

label("Paste a JSON config from VFX Forge:", 1)

local box = Instance.new("TextBox")
box.Size = UDim2.new(1, 0, 0, 280)
box.BackgroundColor3 = Color3.fromRGB(11, 14, 19)
box.TextColor3 = Color3.fromRGB(205, 227, 255)
box.Font = Enum.Font.Code
box.TextSize = 12
box.TextXAlignment = Enum.TextXAlignment.Left
box.TextYAlignment = Enum.TextYAlignment.Top
box.MultiLine = true
box.ClearTextOnFocus = false
box.TextWrapped = true
box.PlaceholderText = '{ "name": "Fire", "rate": 60, ... }'
box.Text = ""
box.LayoutOrder = 2
box.Parent = root
local boxPad = Instance.new("UIPadding")
boxPad.PaddingTop = UDim.new(0, 6); boxPad.PaddingLeft = UDim.new(0, 6)
boxPad.PaddingRight = UDim.new(0, 6); boxPad.Parent = box

local applyBtn = Instance.new("TextButton")
applyBtn.Size = UDim2.new(1, 0, 0, 34)
applyBtn.BackgroundColor3 = Color3.fromRGB(124, 92, 255)
applyBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
applyBtn.Font = Enum.Font.GothamBold
applyBtn.TextSize = 14
applyBtn.Text = "Apply to Selection"
applyBtn.LayoutOrder = 3
applyBtn.Parent = root
local btnCorner = Instance.new("UICorner"); btnCorner.CornerRadius = UDim.new(0, 8); btnCorner.Parent = applyBtn

local status = label("", 4, 36)
status.TextColor3 = Color3.fromRGB(140, 151, 167)
status.TextWrapped = true

button.Click:Connect(function()
	widget.Enabled = not widget.Enabled
end)

-- ---------- config -> ParticleEmitter ----------
local function colorSequence(stops)
	local kps = {}
	for _, s in ipairs(stops) do
		local c = s.c
		table.insert(kps, ColorSequenceKeypoint.new(s.t, Color3.fromRGB(c[1], c[2], c[3])))
	end
	return ColorSequence.new(kps)
end

local function numberSequence(keys)
	local kps = {}
	for _, k in ipairs(keys) do
		table.insert(kps, NumberSequenceKeypoint.new(k.t, k.v, k.e or 0))
	end
	return NumberSequence.new(kps)
end

local function buildEmitter(cfg, parent)
	local e = Instance.new("ParticleEmitter")
	e.Texture = cfg.texture
	e.Rate = cfg.rate
	e.Lifetime = NumberRange.new(cfg.lifetime[1], cfg.lifetime[2])
	e.Speed = NumberRange.new(cfg.speed[1], cfg.speed[2])
	e.SpreadAngle = Vector2.new(cfg.spreadAngle[1], cfg.spreadAngle[2])
	e.Rotation = NumberRange.new(cfg.rotation[1], cfg.rotation[2])
	e.RotSpeed = NumberRange.new(cfg.rotSpeed[1], cfg.rotSpeed[2])
	e.Acceleration = Vector3.new(cfg.acceleration[1], cfg.acceleration[2], cfg.acceleration[3])
	e.Drag = cfg.drag
	e.LightEmission = cfg.lightEmission
	e.LightInfluence = cfg.lightInfluence
	e.Brightness = cfg.brightness
	e.ZOffset = cfg.zOffset
	e.TimeScale = cfg.timeScale
	e.EmissionDirection = Enum.NormalId[cfg.emissionDirection]
	e.Orientation = Enum.ParticleOrientation[cfg.orientation]
	e.Enabled = cfg.enabled
	e.Color = colorSequence(cfg.color)
	e.Size = numberSequence(cfg.size)
	e.Transparency = numberSequence(cfg.transparency)
	e.Parent = parent
	return e
end

local function setStatus(text, ok)
	status.Text = text
	status.TextColor3 = ok and Color3.fromRGB(80, 220, 130) or Color3.fromRGB(240, 120, 120)
end

applyBtn.MouseButton1Click:Connect(function()
	local targets = Selection:Get()
	if #targets == 0 then
		setStatus("Select a Part or Attachment first.", false)
		return
	end

	local ok, cfg = pcall(function()
		return HttpService:JSONDecode(box.Text)
	end)
	if not ok or type(cfg) ~= "table" then
		setStatus("Invalid JSON. Copy the JSON config from VFX Forge.", false)
		return
	end

	local recording = ChangeHistoryService:TryBeginRecording("VFXForge_Apply")
	local count = 0
	for _, target in ipairs(targets) do
		if target:IsA("BasePart") or target:IsA("Attachment") then
			buildEmitter(cfg, target)
			count += 1
		end
	end
	if recording then
		ChangeHistoryService:FinishRecording(recording, Enum.FinishRecordingOperation.Commit)
	end

	if count == 0 then
		setStatus("Nothing valid selected (need a Part or Attachment).", false)
	else
		setStatus(("Applied '%s' to %d object(s)."):format(tostring(cfg.name or "VFX"), count), true)
	end
end)
