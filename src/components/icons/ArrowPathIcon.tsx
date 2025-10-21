import React from 'react'

type Props = React.SVGProps<SVGSVGElement>

export default function ArrowPathIcon(props: Props) {
  const { className, ...rest } = props
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
      {...rest}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16.023 9.348h4.992m0 0V4.356m0 4.992L18.3 7.636A8.25 8.25 0 1012 20.25a8.25 8.25 0 007.5-4.5"
      />
    </svg>
  )
}
