#pragma once

namespace erhe::imgui { class Window_imgui_host; }

namespace editor {

class App_context;

void install_default_layout(
    erhe::imgui::Window_imgui_host& window_imgui_host,
    App_context&                    context
);

}
