from dataclasses import dataclass
from pathlib import Path
import os
import sys
import types


@dataclass(frozen=True)
class RealESRGANRequest:
    input_path: Path
    output_path: Path
    scale: int = 4
    model_name: str = "RealESRGAN_x4plus"


SUPPORTED_MODELS = {"RealESRGAN_x4plus"}
MODEL_URLS = {
    "RealESRGAN_x4plus": "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth",
}


def _read_bool_env(name: str, default: bool) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


def _install_torchvision_functional_tensor_shim() -> None:
    if "torchvision.transforms.functional_tensor" in sys.modules:
        return

    from torchvision.transforms import functional as functional

    shim = types.ModuleType("torchvision.transforms.functional_tensor")
    shim.rgb_to_grayscale = functional.rgb_to_grayscale
    sys.modules["torchvision.transforms.functional_tensor"] = shim


def upscale_image(request: RealESRGANRequest) -> Path:
    if request.scale not in (2, 4):
        raise ValueError("RealESRGAN scale must be 2 or 4")

    if request.model_name not in SUPPORTED_MODELS:
        raise ValueError(f"Unsupported RealESRGAN model: {request.model_name}")

    if not request.input_path.exists():
        raise FileNotFoundError(f"Input image not found: {request.input_path}")

    request.output_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        import cv2
        _install_torchvision_functional_tensor_shim()
        from basicsr.archs.rrdbnet_arch import RRDBNet
        from realesrgan import RealESRGANer
    except ImportError as error:
        raise RuntimeError(
            "RealESRGAN dependencies are missing. Install workers/gpu-worker/requirements.txt in the Python environment."
        ) from error

    image = cv2.imread(str(request.input_path), cv2.IMREAD_UNCHANGED)
    if image is None:
        raise ValueError(f"Unable to read input image: {request.input_path}")

    model = RRDBNet(
        num_in_ch=3,
        num_out_ch=3,
        num_feat=64,
        num_block=23,
        num_grow_ch=32,
        scale=request.scale,
    )
    model_dir = os.environ.get("REALESRGAN_MODEL_DIR")
    model_path = MODEL_URLS[request.model_name]
    if model_dir:
        candidate = Path(model_dir) / f"{request.model_name}.pth"
        if candidate.exists():
            model_path = str(candidate)

    tile = int(os.environ.get("REALESRGAN_TILE", "0"))
    half = _read_bool_env("REALESRGAN_HALF", False)
    upsampler = RealESRGANer(
        scale=request.scale,
        model_path=model_path,
        model=model,
        tile=tile,
        tile_pad=10,
        pre_pad=0,
        half=half,
    )
    output, _ = upsampler.enhance(image, outscale=request.scale)

    if not cv2.imwrite(str(request.output_path), output):
        raise RuntimeError(f"Unable to write output image: {request.output_path}")

    return request.output_path
