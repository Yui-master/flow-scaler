import argparse
from pathlib import Path

from processors.realesrgan import RealESRGANRequest, upscale_image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run RealESRGAN image upscale")
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--scale", required=True, type=int)
    parser.add_argument("--model", required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output_path = upscale_image(
        RealESRGANRequest(
            input_path=Path(args.input),
            output_path=Path(args.output),
            scale=args.scale,
            model_name=args.model,
        )
    )
    print(output_path)


if __name__ == "__main__":
    main()
