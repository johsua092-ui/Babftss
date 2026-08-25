from erhe_codegen import *

struct("Windows_visibility_config",
    version=1,
    short_desc="Window visibility state",
    long_desc="",
    developer=False,
    fields=[
        field("windows", Map(String, Bool), added_in=1),
    ],
)
