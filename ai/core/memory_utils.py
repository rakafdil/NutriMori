import os
import sys

def _from_proc() -> float:
    """Linux: read VmRSS from /proc/self/status (MB)."""
    try:
        with open("/proc/self/status", "r") as f:
            for line in f:
                if line.startswith("VmRSS:"):
                    parts = line.split()
                    # VmRSS:    123456 kB
                    kb = int(parts[1])
                    return kb / 1024.0
    except Exception:
        pass
    return 0.0

def _from_resource() -> float:
    """Fallback using resource (gives KB on some platforms)."""
    try:
        import resource
        usage = resource.getrusage(resource.RUSAGE_SELF)
        # ru_maxrss is platform-dependent: on Linux it's in kilobytes
        kb = getattr(usage, "ru_maxrss", 0)
        return kb / 1024.0
    except Exception:
        return 0.0

def get_process_memory_mb() -> float:
    """
    Return resident memory usage in MB.
    Tries psutil if installed, otherwise falls back to /proc or resource.
    """
    try:
        import psutil
        proc = psutil.Process(os.getpid())
        rss = proc.memory_info().rss  # bytes
        return rss / (1024.0 * 1024.0)
    except Exception:
        # Try /proc (Linux)
        mb = _from_proc()
        if mb > 0:
            return mb
        # Fallback to resource
        mb = _from_resource()
        return mb
